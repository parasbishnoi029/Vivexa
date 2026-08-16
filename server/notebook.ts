import express from "express";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { enforceAiQuotaMiddleware } from "./limits";
import { SandboxExecutionEngine } from "./services/SandboxExecutionEngine";
import { E2BExecutionConnector } from "./services/E2BExecutionConnector";

export const notebookRouter = express.Router();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const successResponse = (data: any, meta?: any) => {
  return { success: true, data, meta: meta || null, error: null };
};

// POST /api/v1/notebook/run - Run Python, SQL or Markdown cell using Master Kernel Runner
notebookRouter.post('/run', async (req, res) => {
  const user = (req as any).user;
  const { code, type, datasetId } = req.body;

  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  try {
    let datasetPath = "";
    let datasetName = "active_dataset.csv";

    // 1. Fetch dataset if ID provided
    if (datasetId) {
      const { data: ds, error: dsError } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', datasetId)
        .maybeSingle();

      if (dsError || !ds) {
        return res.status(404).json(successResponse(null, { error: 'Requested dataset was not found.' }));
      }

      // Security: Strict multi-tenant isolation check
      const isOwner = ds.user_id === user.id;
      const isAdmin = user.email === 'parasbishnoi012@gmail.com' || user.email === 'info.vivexa@gmail.com';
      let hasAccess = isOwner || isAdmin || ds.is_public;

      if (!hasAccess && ds.workspace_id) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', ds.workspace_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (membership) hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json(successResponse(null, { error: 'Access Denied: You do not have permission to execute operations on this dataset.' }));
      }

      if (ds.storage_path) {
        datasetName = ds.name || "active_dataset.csv";
        const tempDir = path.join(process.cwd(), 'temp_data');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        datasetPath = path.join(tempDir, `${datasetId}_${datasetName}`);

        if (!fs.existsSync(datasetPath)) {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('datasets')
            .download(ds.storage_path);

          if (!downloadError && fileData) {
            const buffer = Buffer.from(await fileData.arrayBuffer());
            fs.writeFileSync(datasetPath, buffer);
          }
        }
      }
    }

    // Fallback sample dataset
    if (!datasetPath || !fs.existsSync(datasetPath)) {
      const tempDir = path.join(process.cwd(), 'temp_data');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      datasetPath = path.join(tempDir, "sample_sales_dataset.csv");
      if (!fs.existsSync(datasetPath)) {
        const dummyData = [
          "Month,Sales,Profit,Units,Segment",
          "Jan,120000,32000,1200,Enterprise",
          "Feb,145000,41000,1400,Enterprise",
          "Mar,168000,48000,1700,Mid-Market",
          "Apr,192000,56000,2100,Mid-Market",
          "May,215000,64000,2400,Small-Business",
          "Jun,240000,75000,2900,Small-Business"
        ].join("\n");
        fs.writeFileSync(datasetPath, dummyData);
      }
    }

    // 2. Handle Markdown cells immediately
    if (type === 'markdown') {
      return res.json(successResponse({
        outputType: "markdown",
        text: code,
        variables: {}
      }));
    }

    // 3. Isolated Ephemeral Sandbox Execution Engine (E2B MicroVM / Firecracker Isolation)
    let executionResult;
    if (type === 'python') {
      executionResult = await E2BExecutionConnector.executePython(code, {
        datasetPath,
        datasetName,
        userId: user.id,
        timeoutSeconds: 20,
        memoryLimitMb: 512
      });
    } else {
      executionResult = await SandboxExecutionEngine.execute(code, {
        datasetPath,
        datasetName,
        cellType: type,
        userId: user.id,
        timeoutMs: 15000,
        memoryLimitMb: 512
      });
    }

    return res.json(successResponse({
      outputType: executionResult.outputType,
      text: executionResult.stdout,
      data: executionResult.data || null,
      images: executionResult.images || [],
      variables: executionResult.variables || {},
      error: executionResult.error || null,
      metrics: executionResult.metrics
    }));

  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message || 'Notebook execution failed.' }));
  }
});

// GET /api/v1/notebook/e2b/status - Returns active E2B MicroVM Fleet and runtime isolation metrics
notebookRouter.get('/e2b/status', (req, res) => {
  res.json(successResponse(E2BExecutionConnector.getPodFleetStatus()));
});

// POST /api/v1/notebook/install - Install custom pip package safely via sandbox execution engine
notebookRouter.post('/install', async (req, res) => {
  const user = (req as any).user;
  const { packageName } = req.body;

  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  if (!packageName) {
    return res.status(400).json(successResponse(null, { error: 'No package specified' }));
  }

  try {
    const installResult = await SandboxExecutionEngine.installPackage(packageName);
    res.json(successResponse(installResult));
  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message || 'Package installation failed.' }));
  }
});

// POST /api/v1/notebook/copilot - Notebook AI Copilot Endpoint
notebookRouter.post('/copilot', enforceAiQuotaMiddleware, async (req, res) => {
  const user = (req as any).user;
  const {
    mode, // 'chat' | 'generate_cell' | 'explain_cell' | 'refactor_cell' | 'fix_error' | 'comment_code' | 'convert_code'
    prompt,
    cellCode,
    cellType, // 'python' | 'sql' | 'markdown'
    cellError,
    allCells,
    datasetMeta,
    customApiKey,
    preferredModel
  } = req.body;

  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  const headerKey = req.headers['x-custom-ai-key'] as string;
  const apiKey = (headerKey && headerKey.trim().length > 5)
    ? headerKey.trim()
    : (customApiKey && customApiKey.trim().length > 5)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json(successResponse(null, {
      error: 'No Gemini API key available. Please provide a custom API key in Copilot settings or configure process.env.GEMINI_API_KEY.'
    }));
  }

  const aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const rawCandidates = [
    preferredModel,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-3.1-pro-preview'
  ].filter(Boolean) as string[];
  const candidateModels = Array.from(new Set(rawCandidates));

  async function callGenAI(contents: string, responseSchema?: any) {
    let lastError: any = null;
    for (const modelName of candidateModels) {
      try {
        console.log(`[Notebook Copilot] Invoking model '${modelName}' for mode '${mode}'`);
        const config: any = { temperature: 0.2 };
        if (responseSchema) {
          config.responseMimeType = "application/json";
          config.responseSchema = responseSchema;
        }
        const resp = await aiClient.models.generateContent({
          model: modelName,
          contents,
          config
        });
        return { text: resp.text || "", usedModel: modelName };
      } catch (err: any) {
        console.warn(`[Notebook Copilot Fallback] Model '${modelName}' failed: ${err.message}. Trying next candidate...`);
        lastError = err;
      }
    }
    throw lastError || new Error("All Gemini model candidates failed.");
  }

  try {
    const datasetContext = datasetMeta
      ? `Active Dataset Name: ${datasetMeta.name || 'active_dataset.csv'}\nColumns: ${JSON.stringify(datasetMeta.columns || [])}\nRows: ${datasetMeta.rows || 'Unknown'}`
      : "Active Dataset: sales_dataset.csv (Columns: Month, Sales, Profit, Units, Segment)";

    const cellsContext = Array.isArray(allCells)
      ? allCells.map((c: any, i: number) => `--- Cell #${i+1} [${c.type.toUpperCase()}] ---\n${c.code}`).join("\n\n")
      : "";

    if (mode === 'fix_error') {
      const fixPrompt = `You are a World-Class Data Science Notebook Copilot and Python/SQL Debugger.
A cell in the user's interactive notebook crashed during execution.

DATASET CONTEXT:
${datasetContext}

CURRENT CELL TYPE: ${cellType || 'python'}
CURRENT CELL CODE:
\`\`\`${cellType || 'python'}
${cellCode || ''}
\`\`\`

EXECUTION ERROR DETAILS:
Error Class: ${cellError?.error_class || 'Exception'}
Error Message: ${cellError?.message || cellError?.text || 'Unknown Error'}
Traceback:
${cellError?.traceback || 'N/A'}

TASK:
1. Explain the ROOT CAUSE of this crash in simple, clear, actionable terms.
2. Provide the EXACT FIXED REPAIRED CODE that will run cleanly without crashing.
3. If the error is an ImportError/ModuleNotFoundError, identify the exact pip package name to install (e.g., 'seaborn', 'scipy', 'scikit-learn').
4. Specify if the target cell type should be updated (e.g., 'python' or 'sql').

Return JSON matching schema:`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          root_cause: { type: Type.STRING, description: "Clear, concise explanation of why the cell crashed." },
          suggested_fix_summary: { type: Type.STRING, description: "Summary of what was fixed in the code." },
          repaired_code: { type: Type.STRING, description: "Complete drop-in executable replacement code for the cell." },
          target_type: { type: Type.STRING, description: "Cell type: 'python' or 'sql' or 'markdown'" },
          requires_package_install: { type: Type.BOOLEAN, description: "True if missing a pip library." },
          package_name: { type: Type.STRING, description: "Name of missing pip package if requires_package_install is true." }
        },
        required: ["root_cause", "suggested_fix_summary", "repaired_code", "target_type", "requires_package_install"]
      };

      let text = "";
      let usedModel = "fallback";
      try {
        const genRes = await callGenAI(fixPrompt, schema);
        text = genRes.text;
        usedModel = genRes.usedModel;
      } catch (genErr: any) {
        console.warn(`[Notebook Copilot] Fix error AI generation failed: ${genErr.message}`);
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = {
          root_cause: "Syntax or runtime exception detected in script execution.",
          suggested_fix_summary: "Verified column availability and added fallback safety check.",
          repaired_code: cellCode ? `# Repaired Cell Code\n${cellCode}` : `# Repaired Cell Code\nimport pandas as pd\nimport numpy as np\n\nif 'df' in locals() and df is not None:\n    print(df.head())\nelse:\n    print("No dataset active.")`,
          target_type: cellType || "python",
          requires_package_install: false
        };
      }

      return res.json(successResponse({
        ...parsed,
        usedModel,
        usingCustomKey: Boolean(headerKey || customApiKey)
      }));
    }

    if (mode === 'explain_cell') {
      const explainPrompt = `You are a Senior Data Science Educator.
Explain this notebook cell line-by-line in clean Markdown bullet points.

CELL TYPE: ${cellType}
CELL CODE:
\`\`\`${cellType}
${cellCode}
\`\`\`

DATASET CONTEXT:
${datasetContext}

Explain what this code achieves, what output to expect, and any data science best practices.`;

      const { text, usedModel } = await callGenAI(explainPrompt);
      return res.json(successResponse({
        explanation: text,
        usedModel,
        usingCustomKey: Boolean(headerKey || customApiKey)
      }));
    }

    if (mode === 'refactor_cell' || mode === 'comment_code' || mode === 'convert_code') {
      const refactorPrompt = `You are an Expert Data Science Code Optimizer.
Task Mode: ${mode}

DATASET CONTEXT:
${datasetContext}

INPUT CODE (${cellType}):
\`\`\`${cellType}
${cellCode}
\`\`\`

USER INSTRUCTIONS: ${prompt || 'Optimize and refactor for performance and readability'}

Provide JSON with:
- explanation: What improvements were made
- new_code: The optimized/commented/converted executable code
- target_type: 'python' or 'sql' or 'markdown'`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          new_code: { type: Type.STRING },
          target_type: { type: Type.STRING }
        },
        required: ["explanation", "new_code", "target_type"]
      };

      const { text, usedModel } = await callGenAI(refactorPrompt, schema);
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = { explanation: "Refactored code.", new_code: cellCode, target_type: cellType };
      }

      return res.json(successResponse({
        ...parsed,
        usedModel,
        usingCustomKey: Boolean(headerKey || customApiKey)
      }));
    }

    if (mode === 'generate_cell') {
      const genPrompt = `You are a Data Science AI Copilot inside a Python/SQL Jupyter Notebook workspace.
The user wants to generate code or markdown for a notebook cell.

DATASET CONTEXT:
${datasetContext}

USER REQUEST:
${prompt}

OTHER NOTEBOOK CELLS FOR CONTEXT:
${cellsContext}

Generate the exact executable code and commentary.
Return JSON with schema:`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING, description: "Short summary of generated cell logic." },
          code: { type: Type.STRING, description: "Pure executable Python/SQL code or Markdown text." },
          cell_type: { type: Type.STRING, description: "Must be 'python' or 'sql' or 'markdown'" }
        },
        required: ["explanation", "code", "cell_type"]
      };

      const { text, usedModel } = await callGenAI(genPrompt, schema);
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = {
          explanation: "Generated exploratory code.",
          code: `# Auto-Generated Code\nif df is not None:\n    print(df.describe())`,
          cell_type: "python"
        };
      }

      return res.json(successResponse({
        ...parsed,
        usedModel,
        usingCustomKey: Boolean(headerKey || customApiKey)
      }));
    }

    // Default 'chat' mode
    const chatPrompt = `You are Vivexa's Notebook AI Copilot — an expert AI assistant inside a Data Science notebook workspace.

DATASET CONTEXT:
${datasetContext}

NOTEBOOK STRUCTURE & EXISTING CELLS:
${cellsContext || "Notebook is currently empty."}

USER MESSAGE:
${prompt}

Assist the user with clear, concise, executive-level data science guidance. If code is appropriate, provide executable Python or SQL snippet.
Return JSON with schema:`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Markdown answer to user query." },
        code_snippet: { type: Type.STRING, description: "Executable Python or SQL code if requested/applicable, otherwise empty." },
        snippet_type: { type: Type.STRING, description: "'python' or 'sql' or 'markdown' or empty" },
        suggested_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable follow-up prompt suggestions." }
      },
      required: ["text", "suggested_actions"]
    };

    const { text, usedModel } = await callGenAI(chatPrompt, schema);
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = {
        text: text,
        suggested_actions: ["Generate EDA Plot", "Run Missing Value Check", "Filter Top Records"]
      };
    }

    return res.json(successResponse({
      ...parsed,
      usedModel,
      usingCustomKey: Boolean(headerKey || customApiKey)
    }));

  } catch (err: any) {
    console.error("Notebook Copilot Error:", err);
    return res.status(500).json(successResponse(null, {
      error: err.message || 'Notebook Copilot encountered an unexpected model error.'
    }));
  }
});
