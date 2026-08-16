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
   * Runs Python script inside the isolated WASM sandbox with strict execution timeout.
   */
  public async execute(
    cellId: string,
    code: string,
    dataset?: Record<string, any>[]
  ): Promise<PyodideExecutionResult> {
    if (!this.worker) {
      this.initWorker();
    }

    return new Promise<PyodideExecutionResult>((resolve) => {
      let isTimedOut = false;
      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        this.activePendingCallbacks.delete(cellId);
        // Terminate worker if it hangs (e.g. while True infinite loop) and restart
        this.initWorker();
        resolve({
          id: cellId,
          success: false,
          error: `Execution timed out after ${PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs / 1000}s. Sandbox process was safely recycled to protect browser memory.`,
          executionTime: `${PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs / 1000}s`,
        });
      }, PYODIDE_SANDBOX_POLICY.maxExecutionTimeoutMs);

      this.activePendingCallbacks.set(cellId, (result) => {
        if (!isTimedOut) {
          clearTimeout(timeoutId);
          resolve(result);
        }
      });

      this.worker?.postMessage({
        id: cellId,
        code,
        dataset: dataset?.slice(0, 5000), // Inject dataset safely
      });
    });
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
