const fs = require('fs');
let code = fs.readFileSync('src/components/workspace/ExecutiveReportViewer.tsx', 'utf8');

// I need to wrap the return in createPortal properly.
// The file ends with:
/*
      </motion.div>
    </div>
  );
}
*/
const oldEnd = `      </motion.div>
    </div>
  );
}`;
const newEnd = `      </motion.div>
    </div>,
    document.body
  );
}`;

code = code.replace(oldEnd, newEnd);

const oldStart = `  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">`;
const newStart = `  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-wrapper">`;

code = code.replace(oldStart, newStart);
fs.writeFileSync('src/components/workspace/ExecutiveReportViewer.tsx', code);
