const fs = require('fs');
let content = fs.readFileSync('src/pages/workspace/Settings.tsx', 'utf8');

// The marker where the syntax error is:
// "              {</div>          </div>        )}\n              {/* ADVANCED DEVELOPER TAB */}"
// Let's replace the whole block from "              {</div>          </div>        )}" up to the end of FAQ.

const regex = /              \{\<\/div>\s*<\/div>\s*\}\)\s*\}\s*\/\* ADVANCED DEVELOPER TAB \*\/[\s\S]*?<\/div>\s*\}\)\s*\}/;

content = content.replace(regex, '');

fs.writeFileSync('src/pages/workspace/Settings.tsx', content);
