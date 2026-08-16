const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Dashboard.tsx', 'utf8');

// The code is currently:
//                   </div>
//                 ))}
//               </div>

code = code.replace(
  /                  <\/div>\n                \}\)\}\n              <\/div>/,
  `                  </div>
                ))}
                })()}
              </div>`
);

fs.writeFileSync('src/pages/workspace/Dashboard.tsx', code);
