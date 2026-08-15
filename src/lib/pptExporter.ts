import pptxgen from "pptxgenjs";

export const exportReportToPPT = (report: any) => {
  const pptx = new pptxgen();
  const parsedContent = typeof report.content === "string" ? JSON.parse(report.content) : (report.content || report);
  
  const title = report.title || parsedContent.title || "Executive Briefing";
  const datasetName = parsedContent.dataset_name || report.dataset_name || "Dataset";
  const summary = parsedContent.executive_summary || "";
  const findings = parsedContent.key_findings || [];
  const metrics = parsedContent.c_suite_metrics || [];
  const actions = parsedContent.strategic_actions || [];

  const addWatermark = (slide: any) => {
    slide.addText("Vivexa", { x: 8.5, y: 5.3, w: 1.2, fontSize: 10, color: "475569", bold: true, align: "right" });
  };

  // 1. Title Slide
  const slide1 = pptx.addSlide();
  addWatermark(slide1);
  slide1.background = { fill: "0F172A" };
  slide1.addText("VIVEXA AI", { x: 0.5, y: 0.5, fontSize: 14, color: "8B5CF6", bold: true });
  slide1.addText(title, { x: 0.5, y: 2.5, w: "90%", fontSize: 36, color: "FFFFFF", bold: true, align: "center" });
  slide1.addText(`Strategic Decision Briefing for ${datasetName}`, { x: 0.5, y: 3.5, w: "90%", fontSize: 18, color: "94A3B8", align: "center" });
  slide1.addText(`Generated: ${new Date().toLocaleString()}`, { x: 0.5, y: 5.0, w: "90%", fontSize: 12, color: "64748B", align: "center" });

  // 2. Executive Summary Slide
  const slide2 = pptx.addSlide();
  addWatermark(slide2);
  slide2.background = { fill: "0F172A" };
  slide2.addText("Executive Summary", { x: 0.5, y: 0.5, fontSize: 24, color: "8B5CF6", bold: true });
  slide2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 9.0, h: 0.05, fill: { color: "334155" } });
  slide2.addText(summary, { x: 0.5, y: 1.5, w: 9.0, fontSize: 14, color: "E2E8F0", align: "left" });

  // 3. Key Metrics Slide
  const slide3 = pptx.addSlide();
  addWatermark(slide3);
  slide3.background = { fill: "0F172A" };
  slide3.addText("C-Suite Key Performance Metrics", { x: 0.5, y: 0.5, fontSize: 24, color: "8B5CF6", bold: true });
  
  metrics.forEach((m: any, idx: number) => {
    const xPos = 0.5 + (idx % 3) * 3.2;
    const yPos = 1.5 + Math.floor(idx / 3) * 1.8;
    
    slide3.addShape(pptx.ShapeType.rect, { x: xPos, y: yPos, w: 2.8, h: 1.4, fill: { color: "1E293B" }, line: { color: "334155" } });
    slide3.addText(m.label, { x: xPos + 0.1, y: yPos + 0.2, w: 2.6, fontSize: 10, color: "94A3B8" });
    slide3.addText(m.value, { x: xPos + 0.1, y: yPos + 0.5, w: 2.6, fontSize: 20, color: "FFFFFF", bold: true });
    slide3.addText(`${m.status} (${m.benchmark})`, { x: xPos + 0.1, y: yPos + 0.9, w: 2.6, fontSize: 9, color: "10B981" });
  });

  // 4. Statistical Findings Slide
  const slide4 = pptx.addSlide();
  addWatermark(slide4);
  slide4.background = { fill: "0F172A" };
  slide4.addText("Key Statistical Findings", { x: 0.5, y: 0.5, fontSize: 24, color: "8B5CF6", bold: true });
  
  findings.slice(0, 6).forEach((f: string, idx: number) => {
    slide4.addText(`• ${f}`, { x: 0.5, y: 1.2 + idx * 0.7, w: 9.0, fontSize: 14, color: "E2E8F0" });
  });

  // 5. Strategic Action Roadmap
  const slide5 = pptx.addSlide();
  addWatermark(slide5);
  slide5.background = { fill: "0F172A" };
  slide5.addText("Strategic Action Roadmap", { x: 0.5, y: 0.5, fontSize: 24, color: "8B5CF6", bold: true });
  
  const rows: any[] = [
    [{ text: "Priority", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } }, 
     { text: "Strategic Action", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } }, 
     { text: "ROI", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } }]
  ];
  
  actions.slice(0, 5).forEach((a: any) => {
    rows.push([
      { text: a.priority, options: { color: a.priority === "High" ? "EF4444" : "FFFFFF", bold: false, fill: { color: "0F172A" } } },
      { text: a.action || a.Strategic_Action || "", options: { color: "E2E8F0", bold: false, fill: { color: "0F172A" } } },
      { text: a.ROI || "High", options: { color: "10B981", bold: false, fill: { color: "0F172A" } } }
    ]);
  });
  
  slide5.addTable(rows, { x: 0.5, y: 1.5, w: 9.0, border: { pt: 1, color: "334155" }, fontSize: 12 });

  // 6. Final Slide
  const slide6 = pptx.addSlide();
  addWatermark(slide6);
  slide6.background = { fill: "1E293B" };
  slide6.addText("Strategic Partnership Enabled by Vivexa AI", { x: 0.5, y: 2.0, w: "90%", fontSize: 28, color: "FFFFFF", bold: true, align: "center" });
  slide6.addText("Confidential Board Advisory Material", { x: 0.5, y: 3.5, w: "90%", fontSize: 14, color: "8B5CF6", align: "center" });
  slide6.addText("www.vivexa.ai", { x: 0.5, y: 5.0, w: "90%", fontSize: 12, color: "64748B", align: "center" });

  pptx.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pptx` });
};
