const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

if (!code.includes('import { createPortal }')) {
  code = 'import { createPortal } from "react-dom";\n' + code;
}

// 1. Generate Briefing Modal
code = code.replace(
  '{isModalOpen && (',
  '{isModalOpen && createPortal('
);

// We need to replace the `)` with `), document.body)` for this modal.
// It ends at:
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
code = code.replace(
  '            </motion.div>\n          </div>\n        )}',
  '            </motion.div>\n          </div>,\n          document.body\n        )}'
);


// 2. History Sidebar
code = code.replace(
  '{isHistorySidebarOpen && (',
  '{isHistorySidebarOpen && createPortal('
);

code = code.replace(
  '            </motion.div>\n          </div>\n        )}',
  '            </motion.div>\n          </div>,\n          document.body\n        )}'
);

// 3. Compare Modal
code = code.replace(
  '{isCompareModalOpen && reportA && reportB && (',
  '{isCompareModalOpen && reportA && reportB && createPortal('
);

code = code.replace(
  '            </motion.div>\n          </div>\n        )}',
  '            </motion.div>\n          </div>,\n          document.body\n        )}'
);

// Update z-indexes to 9999
code = code.replace(/className="fixed inset-0 z-50 /g, 'className="fixed inset-0 z-[9999] ');

fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
