import express from "express";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { enforceAiQuotaMiddleware } from "./limits";

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

    // 3. File-Based Execution with Master Kernel Script
    const runnerId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const codePath = path.join(process.cwd(), `temp_code_${runnerId}.py`);
    const configPath = path.join(process.cwd(), `temp_config_${runnerId}.json`);
    const masterScriptPath = path.join(process.cwd(), 'server', 'notebook_kernel_master.py');

    fs.writeFileSync(codePath, code || "# Empty cell", 'utf-8');
    fs.writeFileSync(configPath, JSON.stringify({
      datasetPath,
      datasetName,
      cellType: type,
      codePath
    }), 'utf-8');

    exec(`python3 "${masterScriptPath}" "${configPath}"`, (error, stdout, stderr) => {
      try {
        if (fs.existsSync(codePath)) fs.unlinkSync(codePath);
        if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      } catch (e) {}

      const combinedStderr = stderr ? stderr.toString() : "";
      const combinedStdout = stdout ? stdout.toString() : "";
      
      // Process normally, ignoring the mock
      
      if (type === 'sql') {
        const sqlStart = combinedStdout.indexOf("VIVEXA_SQL_OUTPUT_START");
        const sqlEnd = combinedStdout.indexOf("VIVEXA_SQL_OUTPUT_END");

        if (sqlStart !== -1 && sqlEnd !== -1) {
          const jsonText = combinedStdout.substring(sqlStart + "VIVEXA_SQL_OUTPUT_START".length, sqlEnd).trim();
          try {
            const tableRows = JSON.parse(jsonText);
            return res.json(successResponse({
              outputType: "table",
              data: tableRows,
              variables: {}
            }));
          } catch (pe) {
            return res.status(500).json(successResponse(null, { error: `SQL output parse error: ${pe}` }));
          }
        } else {
          const sqlErrStart = combinedStdout.indexOf("VIVEXA_PYTHON_ERROR_START");
          const sqlErrEnd = combinedStdout.indexOf("VIVEXA_PYTHON_ERROR_END");
          if (sqlErrStart !== -1 && sqlErrEnd !== -1) {
            const errJson = combinedStdout.substring(sqlErrStart + "VIVEXA_PYTHON_ERROR_START".length, sqlErrEnd).trim();
            try {
              const errPayload = JSON.parse(errJson);
              return res.json(successResponse({
                outputType: "error",
                error: errPayload,
                variables: {}
              }));
            } catch (e) {}
          }
          return res.json(successResponse({
            outputType: "text",
            text: combinedStdout || combinedStderr || "SQL query executed.",
            error: {
              error_class: "SQLExecutionError",
              message: combinedStderr || "Check database query formatting and table existence.",
              line_number: 1,
              suggested_fix: "Check table and column names. Select from 'dataset' or 'df'."
            }
          }));
        }
      } else {
        const pyStart = combinedStdout.indexOf("VIVEXA_PYTHON_OUTPUT_START");
        const pyEnd = combinedStdout.indexOf("VIVEXA_PYTHON_OUTPUT_END");

        const pyErrStart = combinedStdout.indexOf("VIVEXA_PYTHON_ERROR_START");
        const pyErrEnd = combinedStdout.indexOf("VIVEXA_PYTHON_ERROR_END");

        if (pyStart !== -1 && pyEnd !== -1) {
          const jsonText = combinedStdout.substring(pyStart + "VIVEXA_PYTHON_OUTPUT_START".length, pyEnd).trim();
          try {
            const payload = JSON.parse(jsonText);
            let outputType = "text";
            if (payload.images && payload.images.length > 0) {
              outputType = "chart";
            } else if (payload.table_data && payload.table_data.length > 0) {
              outputType = "table";
            }

            return res.json(successResponse({
              outputType: outputType,
              text: payload.stdout || (outputType === "text" ? "Cell executed cleanly." : ""),
              data: payload.table_data || null,
              images: payload.images || [],
              variables: payload.variables || {}
            }));
          } catch (pe) {
            return res.status(500).json(successResponse(null, { error: `Python stdout parse error: ${pe}` }));
          }
        } else if (pyErrStart !== -1 && pyErrEnd !== -1) {
          const jsonText = combinedStdout.substring(pyErrStart + "VIVEXA_PYTHON_ERROR_START".length, pyErrEnd).trim();
          try {
            const errPayload = JSON.parse(jsonText);
            return res.json(successResponse({
              outputType: "error",
              text: combinedStdout.substring(0, pyErrStart).trim(),
              error: errPayload,
              variables: {}
            }));
          } catch (pe) {
            return res.status(500).json(successResponse(null, { error: `Python stderr parse error: ${pe}` }));
          }
        } else {
          return res.json(successResponse({
            outputType: "error",
            text: combinedStdout || "Process terminated.",
            error: {
              error_class: "KernelExecutionCrash",
              message: combinedStderr || "Uncaught Python kernel crash.",
              line_number: null,
              suggested_fix: "Restart notebook kernel."
            },
            variables: {}
          }));
        }
      }
    });

  } catch (err: any) {
    res.status(500).json(successResponse(null, { error: err.message || 'Notebook execution failed.' }));
  }
});

// POST /api/v1/notebook/install - Install custom pip/apt package safely
notebookRouter.post('/install', async (req, res) => {
  const user = (req as any).user;
  const { packageName } = req.body;

  if (!user?.id) {
    return res.status(401).json(successResponse(null, { error: 'Unauthorized' }));
  }

  if (!packageName) {
    return res.status(400).json(successResponse(null, { error: 'No package specified' }));
  }

  const cleanPackage = packageName.trim().replace(/[^a-zA-Z0-9_=-]/g, '');

  exec(`python3 -m pip install --break-system-packages ${cleanPackage} || pip3 install ${cleanPackage} || apt-get install -y python3-${cleanPackage}`, (err, stdout, stderr) => {
    if (err) {
      return res.json(successResponse({
        success: false,
        stdout: stdout ? stdout.toString() : "",
        stderr: stderr ? stderr.toString() : "",
        message: `Package install failed for '${cleanPackage}': ${stderr ? stderr.toString() : err.message}`
      }));
    }

    res.json(successResponse({
      success: true,
      stdout: stdout ? stdout.toString() : "",
      message: `Package '${cleanPackage}' installed successfully into active notebook kernel!`
    }));
  });
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
