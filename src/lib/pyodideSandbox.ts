/**
 * Vivexa Pyodide Sandbox Client
 * Manages the isolated in-browser Pyodide worker, dataset injection, variable inspection, and security policy.
 */

export interface PyodideExecutionResult {
  id: string;
  success: boolean;
  stdout?: string;
  stderr?: string;
  result?: string;
  figures?: string[];
  variables?: Record<string, { name: string; type: string; value: string; size?: any }>;
  executionTime?: string;
  error?: string;
  securityBlocked?: boolean;
}

export interface SandboxPolicyConfig {
  name: string;
  version: string;
  isolationLevel: "Zero-Trust WASM Sandbox" | "Process-Isolated Worker";
  allowedPackages: string[];
  blockedSyscalls: string[];
  maxExecutionTimeoutMs: number;
  memoryBoundaryMB: number;
}

export const PYODIDE_SANDBOX_POLICY: SandboxPolicyConfig = {
  name: "Vivexa Pyodide Enterprise Zero-Trust Sandbox",
  version: "v0.25.0-WASM",
  isolationLevel: "Zero-Trust WASM Sandbox",
  allowedPackages: ["pandas", "numpy", "matplotlib", "scipy", "statistics", "math", "json", "datetime", "re"],
  blockedSyscalls: ["os.system", "os.popen", "subprocess", "socket", "urllib", "requests", "ctypes", "raw filesystem write"],
  maxExecutionTimeoutMs: 15000,
  memoryBoundaryMB: 512,
};

class PyodideSandboxManager {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private activePendingCallbacks: Map<string, (result: PyodideExecutionResult) => void> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      if (this.worker) {
        this.worker.terminate();
      }
      this.worker = new Worker("/pythonWorker.js");
      this.worker.onmessage = (event: MessageEvent) => {
        const data = event.data as PyodideExecutionResult;
        if (data.id && this.activePendingCallbacks.has(data.id)) {
          const cb = this.activePendingCallbacks.get(data.id);
          this.activePendingCallbacks.delete(data.id);
          cb?.(data);
        }
      };
      this.worker.onerror = (err) => {
        console.error("Pyodide Sandbox Worker error:", err);
      };
      this.isReady = true;
    } catch (e) {
      console.warn("Failed to spawn Pyodide Sandbox Worker:", e);
      this.isReady = false;
    }
  }

  public isWorkerReady(): boolean {
    return this.isReady;
  }

  /**
   * Runs Python script inside the isolated WASM sandbox with strict execution timeout,
   * with automatic graceful failover to server-side sandboxed container workers
   * if the client browser restricts WebAssembly or Web Worker instantiation (CSP/OOM).
   */
  public async execute(
    cellId: string,
    code: string,
    dataset?: Record<string, any>[]
  ): Promise<PyodideExecutionResult> {
    if (!this.worker || !this.isReady) {
      this.initWorker();
    }

    // If browser environment still blocks worker instantiation (e.g. Content Security Policy `worker-src 'none'`)
    if (!this.worker || !this.isReady) {
      console.warn("⚡ [Pyodide Sandbox] Client Web Worker unavailable due to browser policy. Engaging Enterprise Server Sandboxed Container failover.");
      return this.executeServerContainer(cellId, code, dataset);
    }

    return new Promise<PyodideExecutionResult>((resolve) => {
      let isTimedOut = false;
      const timeoutId = setTimeout(async () => {
        isTimedOut = true;
        this.activePendingCallbacks.delete(cellId);
        // Terminate worker if it hangs (e.g. while True infinite loop) and restart
        this.initWorker();

        // Attempt server container fallback before reporting failure
        try {
          const fallbackResult = await this.executeServerContainer(cellId, code, dataset);
          resolve(fallbackResult);
        } catch {
          resolve({
            id: cellId,
            success: false,
            error: `Execution timed out after ${PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs / 1000}s. Sandbox process was safely recycled to protect browser memory.`,
            executionTime: `${PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs / 1000}s`,
          });
        }
      }, PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs);

      this.activePendingCallbacks.set(cellId, (result) => {
        if (!isTimedOut) {
          clearTimeout(timeoutId);
          // If the worker threw an uncaught error or security exception, attempt server container failover
          if (!result.success && result.error && /worker|wasm|csp|script-src|security/i.test(result.error)) {
            this.executeServerContainer(cellId, code, dataset).then(resolve).catch(() => resolve(result));
            return;
          }
          resolve(result);
        }
      });

      try {
        this.worker.postMessage({
          id: cellId,
          code,
          dataset: dataset?.slice(0, 5000), // Inject dataset safely
        });
      } catch (postErr) {
        clearTimeout(timeoutId);
        this.activePendingCallbacks.delete(cellId);
        console.warn("Pyodide postMessage failed, falling back to server container:", postErr);
        this.executeServerContainer(cellId, code, dataset).then(resolve);
      }
    });
  }

  /**
   * Automated fallback: executes Python in an isolated server-side sandboxed container.
   */
  public async executeServerContainer(
    cellId: string,
    code: string,
    dataset?: Record<string, any>[]
  ): Promise<PyodideExecutionResult> {
    const startTime = performance.now();
    try {
      const resp = await fetch("/api/v1/enterprise-compute/python/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, dataset: dataset?.slice(0, 1000) })
      });

      if (resp.ok) {
        const resData = await resp.json();
        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        return {
          id: cellId,
          success: resData.success !== false,
          stdout: resData.stdout || (resData.success ? "Execution completed in enterprise server container." : undefined),
          stderr: resData.stderr,
          result: resData.data ? JSON.stringify(resData.data) : undefined,
          figures: resData.images || [],
          variables: resData.variables || {},
          error: resData.error || undefined,
          executionTime: `${duration}s (Server Container Fallback)`,
          securityBlocked: false,
        };
      }
    } catch (err: any) {
      console.warn("Server container fallback failed:", err);
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    return {
      id: cellId,
      success: false,
      error: "Both client WebAssembly sandbox and server container worker were unavailable.",
      executionTime: `${duration}s`,
    };
  }

  /**
   * Resets the Python sandbox environment variables.
   */
  public async resetSandbox(): Promise<boolean> {
    if (!this.worker) return false;
    return new Promise<boolean>((resolve) => {
      const resetId = `reset-${Date.now()}`;
      this.activePendingCallbacks.set(resetId, (res) => {
        resolve(res.success);
      });
      this.worker?.postMessage({
        id: resetId,
        action: "reset",
      });
    });
  }
}

export const pyodideSandbox = new PyodideSandboxManager();
