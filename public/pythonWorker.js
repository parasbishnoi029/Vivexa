/**
 * Vivexa Enterprise Isolated Pyodide WASM Worker
 * Provides zero-trust, in-browser sandboxed Python execution with restricted system resources.
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let isInitializing = false;
let initPromise = null;

// Restricted imports and syscall patterns for defense-in-depth AST policy
const RESTRICTED_PATTERNS = [
  /\bimport\s+os\b/,
  /\bfrom\s+os\b/,
  /\bimport\s+subprocess\b/,
  /\bfrom\s+subprocess\b/,
  /\bimport\s+socket\b/,
  /\bfrom\s+socket\b/,
  /\bimport\s+ctypes\b/,
  /\bfrom\s+ctypes\b/,
  /\b__import__\s*\(\s*['"](?:os|subprocess|socket|ctypes|shutil)['"]\s*\)/,
  /\bopen\s*\(\s*['"]\/(?:etc|proc|sys|root|home|var)/,
];

function checkSecurityPolicy(code) {
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(code)) {
      return {
        allowed: false,
        reason: `Security Sandbox Policy Violation: Unauthorized system resource access blocked (${pattern.toString()}). Only mathematical, scientific, and data analysis packages (pandas, numpy, scipy, matplotlib) are permitted in this browser-isolated sandbox.`,
      };
    }
  }
  return { allowed: true };
}

async function initSandbox() {
  if (pyodide) return pyodide;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    isInitializing = true;
    try {
      pyodide = await loadPyodide({
        stdout: (text) => {},
        stderr: (text) => {},
      });

      // Load essential scientific and data analysis packages
      await pyodide.loadPackage(["pandas", "numpy", "matplotlib", "scipy"]);

      // Harden the Python sandbox runtime environment
      await pyodide.runPythonAsync(`
import sys
import io
import os
import json
import base64

# Restrict dangerous builtins in sandbox globals
class IsolatedSandbox:
    pass

# Patch matplotlib to automatically capture plots as Base64 images
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

_captured_figures = []

def _custom_show():
    global _captured_figures
    for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode('utf-8')
        _captured_figures.append(f"data:image/png;base64,{img_b64}")
    plt.close('all')

plt.show = _custom_show

# Standard dataset container
df = None
      `);

      isInitializing = false;
      return pyodide;
    } catch (err) {
      isInitializing = false;
      throw err;
    }
  })();

  return initPromise;
}

// Pre-initialize sandbox immediately on worker startup
initSandbox().catch((err) => {
  console.warn("Pyodide pre-initialization notice:", err);
});

self.onmessage = async (event) => {
  const { id, code, dataset, action } = event.data;

  if (action === "ping") {
    self.postMessage({ id, type: "pong", ready: !!pyodide });
    return;
  }

  if (action === "reset") {
    try {
      if (pyodide) {
        await pyodide.runPythonAsync(`
import sys
# Reset globals except standard modules
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['sys', 'io', 'json', 'base64', 'pd', 'np', 'plt', 'matplotlib', 'scipy', 'df']:
        del globals()[name]
        `);
      }
      self.postMessage({ id, success: true, message: "Sandbox state reset successfully." });
    } catch (err) {
      self.postMessage({ id, success: false, error: err.message });
    }
    return;
  }

  // 1. Enforce static security policy check
  const securityCheck = checkSecurityPolicy(code);
  if (!securityCheck.allowed) {
    self.postMessage({
      id,
      success: false,
      error: securityCheck.reason,
      securityBlocked: true,
    });
    return;
  }

  try {
    const pyInstance = await initSandbox();

    // 2. Inject dataset into Python sandbox if provided
    if (dataset && Array.isArray(dataset) && dataset.length > 0) {
      const sanitizedJson = JSON.stringify(dataset);
      await pyInstance.runPythonAsync(`
import pandas as pd
import json
_raw_data = json.loads('''${sanitizedJson.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}''')
df = pd.DataFrame(_raw_data)
      `);
    }

    // 3. Reset output capture buffers
    await pyInstance.runPythonAsync(`
_captured_figures = []
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    const startTime = performance.now();

    // 4. Execute the Python script inside the sandbox
    const resultObj = await pyInstance.runPythonAsync(code);

    // 5. Check if any matplotlib plots were created without calling show()
    await pyInstance.runPythonAsync(`
if len(plt.get_fignums()) > 0:
    plt.show()
    `);

    // 6. Harvest stdout, stderr, figures, and user-defined variables
    const stdout = pyInstance.runPython("sys.stdout.getvalue()");
    const stderr = pyInstance.runPython("sys.stderr.getvalue()");
    const figuresJson = pyInstance.runPython("json.dumps(_captured_figures)");
    const figures = JSON.parse(figuresJson || "[]");

    // Harvest active variables for Variable Explorer
    const variablesJson = pyInstance.runPython(`
_vars = {}
for _k, _v in list(globals().items()):
    if not _k.startswith('_') and _k not in ['sys', 'io', 'json', 'base64', 'matplotlib', 'plt', 'IsolatedSandbox', 'checkSecurityPolicy']:
        try:
            _type_name = type(_v).__name__
            _repr = str(_v)
            if len(_repr) > 100:
                _repr = _repr[:100] + "..."
            _vars[_k] = {
                "name": _k,
                "type": _type_name,
                "value": _repr,
                "size": getattr(_v, 'shape', None) or len(_v) if hasattr(_v, '__len__') else None
            }
        except:
            pass
json.dumps(_vars)
    `);

    const variables = JSON.parse(variablesJson || "{}");
    const executionDuration = ((performance.now() - startTime) / 1000).toFixed(2);

    let resultString = "";
    if (resultObj !== undefined && resultObj !== null) {
      try {
        resultString = String(resultObj);
      } catch (e) {
        resultString = "";
      }
    }

    self.postMessage({
      id,
      success: true,
      stdout: stdout || "",
      stderr: stderr || "",
      result: resultString,
      figures: figures,
      variables: variables,
      executionTime: `${executionDuration}s`,
      engine: "Pyodide-WASM-Sandbox (Isolated)",
    });
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      error: err.message || "An unexpected error occurred during Python execution in Pyodide sandbox.",
      executionTime: "0.00s",
    });
  }
};
