const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Notebooks.tsx', 'utf8');

// We'll add the worker reference outside the component or inside useEffect.
const workerHook = `
  // --- PYODIDE WORKER SETUP ---
  const pyodideWorker = useRef<Worker | null>(null);
  const [pyodideReady, setPyodideReady] = useState(false);

  useEffect(() => {
    // Initialize Pyodide Web Worker
    const worker = new Worker('/pythonWorker.js');
    worker.onmessage = (e) => {
      // In a real app we'd dispatch promises based on ID, here we just listen for ready.
      // We will handle specific executions by adding event listeners in the executeCell.
    };
    pyodideWorker.current = worker;
    setPyodideReady(true);
    
    return () => {
      worker.terminate();
    };
  }, []);

  // Modify executeCell
`;

// Insert state
code = code.replace(
  'const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");',
  'const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");\n  const pyodideWorker = useRef<Worker | null>(null);\n  const [pyodideReady, setPyodideReady] = useState(false);\n\n  useEffect(() => {\n    const worker = new Worker("/pythonWorker.js");\n    pyodideWorker.current = worker;\n    setPyodideReady(true);\n    return () => worker.terminate();\n  }, []);\n'
);

// We need to inject the worker execution logic into executeCell
const workerExec = `
    // Pyodide Python Sandboxing Execution
    if (cell.type === 'python' && pyodideWorker.current) {
      return new Promise<void>((resolve) => {
        const messageHandler = (e: MessageEvent) => {
          const data = e.data;
          if (data.id === cellId) {
            pyodideWorker.current?.removeEventListener('message', messageHandler);
            
            const endTime = performance.now();
            const execTime = ((endTime - startTime) / 1000).toFixed(2);
            
            setNotebooks(prev => prev.map(nb => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map(c => {
                  if (c.id === cellId) {
                    if (data.success) {
                       return {
                          ...c,
                          isExecuting: false,
                          executionTime: execTime + 's',
                          output: { type: "text", text: (data.stdout + "\\n" + (data.result || "")).trim() || "Executed successfully." },
                          error: undefined
                       };
                    } else {
                       return {
                          ...c,
                          isExecuting: false,
                          executionTime: execTime + 's',
                          error: data.error
                       };
                    }
                  }
                  return c;
                })
              };
            }));
            
            setKernelStatus("Idle");
            delete abortControllersRef.current[cellId];
            resolve();
          }
        };
        
        pyodideWorker.current.addEventListener('message', messageHandler);
        pyodideWorker.current.postMessage({ id: cellId, code: cell.code });
      });
    }
`;

// find the `try { \n const response = await fetch('/api/v1/notebook/run'`
// We will replace it safely.
code = code.replace(
  "try {\n      const response = await fetch('/api/v1/notebook/run'",
  workerExec + "\n    try {\n      const response = await fetch('/api/v1/notebook/run'"
);

fs.writeFileSync('src/pages/workspace/Notebooks.tsx', code);
