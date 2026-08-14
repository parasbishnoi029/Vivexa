const fs = require('fs');
let content = fs.readFileSync('src/pages/workspace/Settings.tsx', 'utf8');

// Remove Appearance
content = content.replace(/\/\* APPEARANCE & THEME TAB \*\/[\s\S]*?\/\* SECURITY & 2FA TAB \*\//, '/* SECURITY & 2FA TAB */');

// Remove Advanced Developer, Danger Zone, Help & FAQ Reference, Audit Log History.
// Looking at the end of Settings.tsx where these are.
content = content.replace(/\/\* AUDIT LOG HISTORY TAB \*\/[\s\S]*?<\/div>\s*<\/div>\s*\)\s*}/, '</div>\n          </div>\n        )\n}');

fs.writeFileSync('src/pages/workspace/Settings.tsx', content);
