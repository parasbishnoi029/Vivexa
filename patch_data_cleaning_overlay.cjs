const fs = require('fs');
const file = 'src/components/workspace/DataCleaningStudio.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /return \(\s*<div className="space-y-6">/,
`return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {isCleaning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center"
            >
              <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Processing Data</h3>
              <p className="text-sm text-slate-400 mb-6 min-h-[20px]">{cleaningStep}</p>
              <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <motion.div
                  className="bg-indigo-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: \`\${cleaningProgress}%\` }}
                  transition={{ ease: "easeInOut", duration: 0.3 }}
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
