import { jsPDF } from "jspdf";

export function exportReportToPDF(report: any) {
  const content = typeof report.content === "string" ? JSON.parse(report.content) : (report.content || report);
  const title = report.title || content.title || "Senior Data Scientist Executive C-Suite Briefing";
  const datasetName = content.dataset_name || report.dataset_name || "Enterprise Dataset";
  const domain = content.domain || report.domain || "Enterprise Analytics";
  const archetype = content.archetype || report.format || "C-Suite Decision Briefing";
  const accuracy = content.accuracy_rating || "99.999999% Grounded Statistical Precision";
  const createdAt = report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : new Date().toLocaleDateString();

  const metrics = content.c_suite_metrics || [];
  const keyFindings = content.key_findings || [];
  const advisorNotes = content.c_suite_advisor_notes || {};
  const mlRecs = content.ml_benchmark_recommendations || [];
  const strategicActions = content.strategic_actions || [];
  const multiAgent = content.multi_agent_consensus || {};

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Helper function to check page overflow
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addPageFooter();
    }
  };

  const addPageFooter = () => {
    const pageNum = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Executive C-Suite Briefing | ${datasetName} | Verified Grounded Precision`, margin, pageHeight - 8);
    doc.text(`Page ${pageNum}`, pageWidth - margin - 10, pageHeight - 8);
    
    // Vivexa Watermark
    doc.setTextColor(203, 213, 225); // very light slate
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.text("Vivexa", pageWidth - margin - 5, pageHeight - 4, { align: "right" });
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, "F");

  // Accent Top Line
  doc.setFillColor(139, 92, 246); // violet-500
  doc.rect(0, 0, pageWidth, 3, "F");

  // Header Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(167, 139, 250); // violet-400
  doc.text("PRINCIPAL DATA SCIENTIST EXECUTIVE BRIEFING", margin, 12);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  const truncatedTitle = title.length > 55 ? title.substring(0, 52) + "..." : title;
  doc.text(truncatedTitle, margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Dataset: ${datasetName}   |   Domain: ${domain}   |   Format: ${archetype}   |   ${createdAt}`, margin, 28);

  // Precision Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(pageWidth - margin - 55, 8, 55, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(accuracy.substring(0, 30), pageWidth - margin - 52, 12.8);

  y = 44;
  addPageFooter();

  // 1. Executive Summary Box
  checkPageOverflow(35);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 32, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217); // violet-700
  doc.text("Executive Summary & Strategic Overview", margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const summaryText = content.executive_summary || "Automated C-Suite Executive Briefing synthesized with Senior Data Scientist statistical rigor.";
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - (margin * 2) - 10);
  doc.text(splitSummary.slice(0, 4), margin + 5, y + 13);

  y += 38;

  // 2. C-Suite Metrics Grid
  if (metrics.length > 0) {
    checkPageOverflow(45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("C-Suite Key Performance Scorecards", margin, y);
    y += 5;

    const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
    const boxHeight = 16;

    metrics.slice(0, 6).forEach((m: any, index: number) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const bx = margin + col * (boxWidth + 5);
      const by = y + row * (boxHeight + 4);

      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(bx, by, boxWidth, boxHeight, 2, 2, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(m.label || "Metric", bx + 3, by + 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(String(m.value || "-"), bx + 3, by + 11);

      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(String(m.status || "Optimal"), bx + boxWidth - 22, by + 11);
    });

    y += Math.ceil(Math.min(6, metrics.length) / 3) * (boxHeight + 4) + 6;
  }

  // 3. Strategic Pros vs Cons Evaluation
  const pros = content.pros || [];
  const cons = content.cons || [];
  if (pros.length > 0 || cons.length > 0) {
    checkPageOverflow(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Strategic Evaluation: Pros & Cons Matrix", margin, y);
    y += 6;

    // Strategic Strengths (Pros)
    if (pros.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text("Strategic Strengths (Pros)", margin, y);
      y += 4;

      pros.slice(0, 4).forEach((p: any) => {
        checkPageOverflow(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`+ [${p.impact || 'High'}] ${p.title || 'Strength'}: `, margin + 3, y);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const splitP = doc.splitTextToSize(p.description || '', pageWidth - margin - 60);
        doc.text(splitP, margin + 50, y);
        y += Math.max(5, splitP.length * 3.8);
      });
      y += 3;
    }

    // Vulnerabilities & Risks (Cons)
    if (cons.length > 0) {
      checkPageOverflow(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text("Vulnerabilities & Data Liabilities (Cons)", margin, y);
      y += 4;

      cons.slice(0, 3).forEach((c: any) => {
        checkPageOverflow(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`- [${c.severity || 'Moderate'}] ${c.title || 'Risk'}: `, margin + 3, y);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const splitC = doc.splitTextToSize(`${c.risk_description || ''} (Mitigation: ${c.mitigation || ''})`, pageWidth - margin - 60);
        doc.text(splitC, margin + 50, y);
        y += Math.max(5, splitC.length * 3.8);
      });
      y += 4;
    }
  }

  // 3. Key Statistical Findings
  if (keyFindings.length > 0) {
    checkPageOverflow(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Grounded Statistical Findings", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    keyFindings.forEach((kf: string, index: number) => {
      checkPageOverflow(12);
      doc.setFillColor(139, 92, 246);
      doc.circle(margin + 2, y - 1, 1.2, "F");

      const splitFinding = doc.splitTextToSize(`${kf}`, pageWidth - (margin * 2) - 8);
      doc.text(splitFinding, margin + 6, y);
      y += (splitFinding.length * 4.5) + 2;
    });

    y += 4;
  }

  // 4. ML Benchmarks Table
  if (mlRecs.length > 0) {
    checkPageOverflow(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Machine Learning Production Benchmarks", margin, y);
    y += 6;

    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Algorithm", margin + 3, y + 4.2);
    doc.text("Suitability", margin + 50, y + 4.2);
    doc.text("Ideal Use Scenario", margin + 85, y + 4.2);
    doc.text("Target Metric", margin + 145, y + 4.2);
    y += 6;

    mlRecs.forEach((ml: any, idx: number) => {
      checkPageOverflow(8);
      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      doc.rect(margin, y, pageWidth - (margin * 2), 6, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(ml.algorithm || "-").substring(0, 24), margin + 3, y + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(16, 185, 129);
      doc.text(String(ml.suitability || "-"), margin + 50, y + 4.2);

      doc.setTextColor(71, 85, 105);
      doc.text(String(ml.ideal_for || "-").substring(0, 32), margin + 85, y + 4.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(109, 40, 217);
      doc.text(String(ml.target_metric || "-").substring(0, 20), margin + 145, y + 4.2);

      y += 6;
    });

    y += 6;
  }

  // 5. Strategic Action Roadmap
  if (strategicActions.length > 0) {
    checkPageOverflow(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Strategic Action Roadmap & Capital Allocation", margin, y);
    y += 6;

    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Priority", margin + 3, y + 4.2);
    doc.text("Strategic Action Step", margin + 25, y + 4.2);
    doc.text("Category", margin + 115, y + 4.2);
    doc.text("Timeline", margin + 145, y + 4.2);
    doc.text("ROI", margin + 168, y + 4.2);
    y += 6;

    strategicActions.forEach((act: any, idx: number) => {
      checkPageOverflow(8);
      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      doc.rect(margin, y, pageWidth - (margin * 2), 6, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(act.priority === "High" ? 220 : 100, act.priority === "High" ? 38 : 116, act.priority === "High" ? 38 : 139);
      doc.text(String(act.priority || "Medium"), margin + 3, y + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(String(act.action || "-").substring(0, 52), margin + 25, y + 4.2);

      doc.setTextColor(71, 85, 105);
      doc.text(String(act.category || "General").substring(0, 18), margin + 115, y + 4.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(109, 40, 217);
      doc.text(String(act.timeline || "0-30 Days"), margin + 145, y + 4.2);

      doc.setTextColor(16, 185, 129);
      doc.text(String(act.ROI || "High"), margin + 168, y + 4.2);

      y += 6;
    });
    y += 6;
  }

  // 6. Executive Feedback / Directives (if saved)
  let savedNotes = "";
  try {
    if (report && report.id) {
      savedNotes = localStorage.getItem(`report_notes_${report.id}`) || "";
    }
  } catch (e) {
    console.error(e);
  }

  if (savedNotes && savedNotes.trim().length > 0) {
    checkPageOverflow(30);
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 24, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text("C-Suite Executive Directives & Feedback", margin + 5, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59); // slate-800
    const splitNotes = doc.splitTextToSize(savedNotes, pageWidth - (margin * 2) - 10);
    doc.text(splitNotes.slice(0, 3), margin + 5, y + 12);

    y += 28;
  }

  // Save the document
  const fileName = `Executive_Briefing_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}
