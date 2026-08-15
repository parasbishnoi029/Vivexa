const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

if (!code.includes('import { createPortal }')) {
  code = 'import { createPortal } from "react-dom";\n' + code;
}

// 1. {isModalOpen && (
code = code.replace(
  /\{isModalOpen && \(\s*<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950\/85 backdrop-blur-md overflow-y-auto">/,
  '{isModalOpen && createPortal(\n          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">'
);
// The closing for isModalOpen is at line 1205/1206. Let's find it.
// It looks like `</motion.div>\n          </div>\n        )}\n      </AnimatePresence>`
// Since regex over multiple lines can be tricky if we don't know the exact string, let's just do it directly.

function wrapPortal(startRegex, replacement, endRegex, endReplacement) {
  const startMatch = code.match(startRegex);
  if (startMatch) {
    code = code.replace(startRegex, replacement);
    // Find the NEXT occurrence of endRegex after the startMatch index
    const startIdx = code.indexOf(replacement);
    const endMatch = code.substring(startIdx).match(endRegex);
    if (endMatch) {
        const fullEndIdx = startIdx + endMatch.index;
        code = code.substring(0, fullEndIdx) + endReplacement + code.substring(fullEndIdx + endMatch[0].length);
    } else {
        console.log("Could not find end match for", startRegex);
    }
  } else {
    console.log("Could not find start match for", startRegex);
  }
}

// isModalOpen
wrapPortal(
  /\{isModalOpen && \(\s*<div className="fixed inset-0 z-50 [^>]+>/,
  '{isModalOpen && createPortal(\n          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">',
  /<\/motion\.div>\s*<\/div>\s*\)/,
  '</motion.div>\n          </div>,\n          document.body\n        )'
);

// isHistorySidebarOpen
wrapPortal(
  /\{isHistorySidebarOpen && \(\s*<div className="fixed inset-0 z-50 [^>]+>/,
  '{isHistorySidebarOpen && createPortal(\n          <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/80 backdrop-blur-md">',
  /<\/motion\.div>\s*<\/div>\s*\)/,
  '</motion.div>\n          </div>,\n          document.body\n        )'
);

// isCompareModalOpen
wrapPortal(
  /\{isCompareModalOpen && reportA && reportB && \(\s*<div className="fixed inset-0 z-50 [^>]+>/,
  '{isCompareModalOpen && reportA && reportB && createPortal(\n          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">',
  /<\/motion\.div>\s*<\/div>\s*\)/,
  '</motion.div>\n          </div>,\n          document.body\n        )'
);

fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
