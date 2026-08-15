const fs = require('fs');
let code = fs.readFileSync('src/lib/pptExporter.ts', 'utf8');
code = code.replace(
  '// 1. Title Slide',
  `const addWatermark = (slide) => {
    slide.addText("Vivexa", { x: 8.5, y: 5.3, w: 1.2, fontSize: 10, color: "475569", bold: true, align: "right" });
  };

  // 1. Title Slide`
);

code = code.replace(/const slide1 = pptx.addSlide\(\);\n/g, 'const slide1 = pptx.addSlide();\n  addWatermark(slide1);\n');
code = code.replace(/const slide2 = pptx.addSlide\(\);\n/g, 'const slide2 = pptx.addSlide();\n  addWatermark(slide2);\n');
code = code.replace(/const slide3 = pptx.addSlide\(\);\n/g, 'const slide3 = pptx.addSlide();\n  addWatermark(slide3);\n');
code = code.replace(/const slide4 = pptx.addSlide\(\);\n/g, 'const slide4 = pptx.addSlide();\n  addWatermark(slide4);\n');
code = code.replace(/const slide5 = pptx.addSlide\(\);\n/g, 'const slide5 = pptx.addSlide();\n  addWatermark(slide5);\n');
code = code.replace(/const slide6 = pptx.addSlide\(\);\n/g, 'const slide6 = pptx.addSlide();\n  addWatermark(slide6);\n');

fs.writeFileSync('src/lib/pptExporter.ts', code);
