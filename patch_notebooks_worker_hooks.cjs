const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Notebooks.tsx', 'utf8');

const replacement = `  } = useWorkspaceStore();
  
  const pyodideWorker = useRef<Worker | null>(null);
  const [pyodideReady, setPyodideReady] = useState(false);

  useEffect(() => {
    const worker = new Worker('/pythonWorker.js');
    pyodideWorker.current = worker;
    setPyodideReady(true);
    return () => worker.terminate();
  }, []);
`;

code = code.replace(
  '} = useWorkspaceStore();',
  replacement
);

fs.writeFileSync('src/pages/workspace/Notebooks.tsx', code);
