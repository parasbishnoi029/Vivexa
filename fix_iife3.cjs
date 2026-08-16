const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Dashboard.tsx', 'utf8');

code = code.replace("))}             </div>", "))} })()} </div>");
code = code.replace("))}\n              </div>", "))}\n                })()}\n              </div>");
code = code.replace("))}\r\n              </div>", "))}\r\n                })()}\r\n              </div>");

fs.writeFileSync('src/pages/workspace/Dashboard.tsx', code);
