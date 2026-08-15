const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// I already added some generic fixes in a previous step, but let's replace them with more robust modal print css.

const printFix = `
  .print-modal-wrapper {
    position: absolute !important;
    inset: 0 !important;
    display: block !important;
    background: transparent !important;
    overflow: visible !important;
    padding: 0 !important;
  }
  
  .print-modal-content {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
    color: #000000 !important;
  }
  
  /* Make sure scrolling content areas also show all content */
  .overflow-y-auto {
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
  }
  
  /* Hide unnecessary UI elements during print */
  .print-modal-wrapper .border-b,
  .print-modal-wrapper button {
    /* We still want the header, just not the buttons maybe? Or keep them but hide the buttons */
  }

  .print-modal-wrapper .bg-slate-900,
  .print-modal-wrapper .bg-slate-950,
  .print-modal-wrapper .bg-slate-900\\/50 {
    background-color: transparent !important;
  }
`;

css = css.replace('@media print {', '@media print {' + printFix);
fs.writeFileSync('src/index.css', css);
