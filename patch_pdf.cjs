const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfExporter.ts', 'utf8');

const replacement = `  const addPageFooter = () => {
    const pageNum = (doc).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(\`Executive C-Suite Briefing | \${datasetName} | Verified Grounded Precision\`, margin, pageHeight - 8);
    doc.text(\`Page \${pageNum}\`, pageWidth - margin - 10, pageHeight - 8);
    
    // Vivexa Watermark
    doc.setTextColor(203, 213, 225); // very light slate
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.text("Vivexa", pageWidth - margin - 5, pageHeight - 4, { align: "right" });
  };`;

code = code.replace(/  const addPageFooter = \(\) => \{[\s\S]*?  \};\n/, replacement + '\n');
fs.writeFileSync('src/lib/pdfExporter.ts', code);
