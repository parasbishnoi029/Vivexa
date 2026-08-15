const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

// Ensure import
if (!code.includes('import { createPortal }')) {
  code = 'import { createPortal } from "react-dom";\n' + code;
}

// Function to safely wrap in portal
function wrapInPortal(startStr, endStr) {
  const startIdx = code.indexOf(startStr);
  if (startIdx === -1) {
     console.log("Could not find:", startStr);
     return;
  }
  
  // replace start
  const newStartStr = startStr.replace('&& (', '&& createPortal(');
  code = code.replace(startStr, newStartStr);
  
  // Find the endStr AFTER the startIdx
  const postStartCode = code.substring(startIdx);
  const endIdxInPost = postStartCode.indexOf(endStr);
  if (endIdxInPost === -1) {
     console.log("Could not find end:", endStr);
     return;
  }
  
  const fullEndIdx = startIdx + endIdxInPost;
  const newEndStr = endStr.replace('</div>\n        )', '</div>,\n          document.body\n        )');
  
  code = code.substring(0, fullEndIdx) + newEndStr + code.substring(fullEndIdx + endStr.length);
}

// Modal 1: Generation Modal
wrapInPortal(
  '{isModalOpen && (\n          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">',
  '</motion.div>\n          </div>\n        )'
);

// Modal 2: History Sidebar
wrapInPortal(
  '{isHistorySidebarOpen && (\n          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">',
  '</motion.div>\n          </div>\n        )'
);

// Modal 3: Compare Modal
wrapInPortal(
  '{isCompareModalOpen && reportA && reportB && (\n          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">',
  '</motion.div>\n          </div>\n        )'
);

fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
