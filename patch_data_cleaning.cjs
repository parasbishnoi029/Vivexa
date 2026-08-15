const fs = require('fs');
const file = 'src/components/workspace/DataCleaningStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

// add motion import if not present
if (!code.includes('import { motion')) {
  code = code.replace(/import React, \{ useState, useMemo \} from 'react';/, "import React, { useState, useMemo } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");
}

// add state variables
if (!code.includes('const [cleaningStep, setCleaningStep]')) {
  code = code.replace('const [isCleaning, setIsCleaning] = useState(false);',
    'const [isCleaning, setIsCleaning] = useState(false);\n  const [cleaningStep, setCleaningStep] = useState<string>("");\n  const [cleaningProgress, setCleaningProgress] = useState(0);');
}

// update handleRunCleaning
code = code.replace(
  /const handleRunCleaning = \(\) => \{\s*setIsCleaning\(true\);\s*setTimeout\(\(\) => \{\s*try \{/,
`const handleRunCleaning = () => {
    setIsCleaning(true);
    setCleaningStep("Initializing data engine...");
    setCleaningProgress(0);

    const steps = [
      { msg: "Profiling dataset distributions...", delay: 200 },
      { msg: "Applying missing value imputations...", delay: 500 },
      { msg: "Mitigating statistical outliers...", delay: 800 },
      { msg: "Standardizing encodings & features...", delay: 1100 },
      { msg: "Finalizing quality audit...", delay: 1400 },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setCleaningStep(step.msg);
        setCleaningProgress(((idx + 1) / steps.length) * 100);
      }, step.delay);
    });

    setTimeout(() => {
      try {`
);

// update setTimeout delay
code = code.replace(
  /\} finally \{\s*setIsCleaning\(false\);\s*\}\s*\}, 400\);\s*\};/,
`} finally {
        setIsCleaning(false);
        setCleaningStep("");
        setCleaningProgress(0);
      }
    }, 1700);
  };`
);

// add the overlay jsx inside the top level return
code = code.replace(
  /return \(\s*<div className="w-full">/,
`return (
    <div className="w-full relative">
      <AnimatePresence>
        {isCleaning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center"
            >
              <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Processing Data</h3>
              <p className="text-sm text-slate-400 mb-6">{cleaningStep}</p>
              <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <motion.div
                  className="bg-indigo-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: \`\${cleaningProgress}%\` }}
                  transition={{ ease: "linear", duration: 0.3 }}
                />
              </div>
              <div className="w-full text-right">
                <span className="text-xs font-mono text-indigo-300">{Math.round(cleaningProgress)}%</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`
);

fs.writeFileSync(file, code);
