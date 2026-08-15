const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const printFix = `
  .fixed.inset-0.z-50 {
    position: relative !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }
  
  .h-\\[92vh\\] {
    height: auto !important;
    max-height: none !important;
  }
  
  .overflow-hidden {
    overflow: visible !important;
  }

  .overflow-y-auto {
    overflow: visible !important;
  }
`;

css = css.replace('@media print {', '@media print {' + printFix);
fs.writeFileSync('src/index.css', css);
