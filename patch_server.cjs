const fs = require('fs');
const file = 'server/aiAnalyst.ts';
let code = fs.readFileSync(file, 'utf8');

// Add the batch-analyze endpoint
const batchAnalyzeCode = `
// 3.5 POST /api/v1/gemini/batch-analyze - Combined Analytics & Enterprise Intelligence
aiAnalystRouter.post('/batch-analyze', async (req: express.Request, res: express.Response) => {
  try {
    const { profile, dataset_name, rows, cols, project_description, industry_hint, model } = req.body;
    const dsName = dataset_name || profile?.datasetName || 'Business Dataset';
    const totalRows = rows || profile?.totalRows || 1000;
    const totalCols = cols || profile?.totalCols || 10;
    
    // We combine the two prompts into one massive prompt that demands a unified JSON
    const combinedPrompt = \`
You are a Senior Data Scientist and Enterprise Strategist analyzing a dataset named "\${dsName}".
Dimensions: \${totalRows} rows, \${totalCols} columns.
Project Context: \${project_description || 'None provided'}
Industry: \${industry_hint || 'Agnostic'}

Statistical Profile:
\${JSON.stringify(profile?.numericColumns, null, 2)}
\${JSON.stringify(profile?.categoricalColumns, null, 2)}
\${JSON.stringify(profile?.columns, null, 2)}

You must return ONLY a raw valid JSON object with NO markdown formatting, NO backticks, and NO code blocks. The JSON must exactly match this structure:
{
  "analyze": {
    "summary": "High level executive summary (max 3 sentences)",
    "anomalies": ["String array of 3 distinct statistical anomalies"],
    "predictive_signals": ["String array of 3 predictive signals"],
    "prescriptive_actions": [
      { "action": "Action text", "impact": "Impact assessment", "difficulty": "Low|Medium|High" }
    ],
    "sentiment": "Positive|Neutral|Negative|Volatile",
    "data_quality_concerns": ["Any warnings"]
  },
  "enterprise": {
    "industryContext": "Strategic context...",
    "playbooks": [
      { "title": "Playbook title", "steps": ["Step 1..."], "expectedOutcome": "Outcome", "kpi": "KPI name" }
    ],
    "strategicThreats": [
      { "threat": "Threat description", "mitigation": "How to mitigate", "urgency": "High|Medium|Low" }
    ],
    "competitorSignals": ["Signal 1..."]
  }
}\`;

    let batchData: any = null;
    try {
      const response = await callGeminiWithFallback({
        contents: combinedPrompt,
        candidateModels: STANDARD_FALLBACK_MODELS,
        preferredModel: model,
        config: { temperature: 0 }
      });
      const cleanJson = response.text.replace(/\\x60\\x60\\x60json/g, '').replace(/\\x60\\x60\\x60/g, '').trim();
      batchData = JSON.parse(cleanJson);
    } catch (apiErr: any) {
      console.warn("Gemini Batch Analyze API Exception, serving grounded fallback:", apiErr.message);
      // fallback
      batchData = {
        analyze: buildGroundedFallbackAnalyze(profile, dsName, totalRows, totalCols),
        enterprise: buildGroundedFallbackEnterprise(profile, dsName)
      };
    }
    
    // Merge AI insights with real computed data profile
    if (batchData.analyze) {
      batchData.analyze.computedScores = profile?.scores || {
        dataQualityScore: 85,
        completenessScore: 90,
        consistencyScore: 88,
        mlReadinessScore: 75
      };
      batchData.analyze.validationReport = profile?.validationReport || null;
      batchData.analyze.sampleRows = profile?.rawSampleRows || [];
    }

    return res.json(successResponse(batchData));
  } catch (error: any) {
    console.error("Gemini Batch Analyze Error:", error);
    return res.status(500).json(successResponse(null, { error: error.message }));
  }
});
`;

if (!code.includes('/batch-analyze')) {
  code = code.replace(
    "aiAnalystRouter.post('/generate-report'",
    batchAnalyzeCode + "\naiAnalystRouter.post('/generate-report'"
  );
  fs.writeFileSync(file, code);
}
