const fs = require('fs');
let content = fs.readFileSync('src/pages/workspace/Settings.tsx', 'utf8');

const markerIndex = content.indexOf('{</div>          </div>        )}');
if (markerIndex !== -1) {
  // Find where FAQ tab ends
  const faqEndIndex = content.indexOf('</div>\n              )}', markerIndex);
  if (faqEndIndex !== -1) {
    const stringToRemove = content.substring(markerIndex, faqEndIndex + '</div>\n              )}'.length);
    content = content.replace(stringToRemove, '');
    fs.writeFileSync('src/pages/workspace/Settings.tsx', content);
    console.log("Fixed!");
  } else {
    console.log("Could not find faqEndIndex");
  }
} else {
  console.log("Could not find markerIndex");
}
