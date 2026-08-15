const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

const oldEnd = `          </div>
        )}
      </AnimatePresence>`;

const newEnd = `          </div>,
          document.body
        )}
      </AnimatePresence>`;

code = code.replace(oldEnd, newEnd);
fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
