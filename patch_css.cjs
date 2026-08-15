const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const watermarkCss = `
  /* Print Watermark */
  body::after {
    content: "Vivexa";
    position: fixed;
    bottom: 10mm;
    right: 10mm;
    font-size: 14pt;
    font-weight: bold;
    font-style: italic;
    color: #94a3b8 !important;
    z-index: 999999;
    opacity: 0.6;
    pointer-events: none;
  }
`;

css = css.replace('@media print {', '@media print {' + watermarkCss);
fs.writeFileSync('src/index.css', css);
