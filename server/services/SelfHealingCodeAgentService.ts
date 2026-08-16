import { SandboxExecutionEngine, SandboxExecutionOptions, SandboxExecutionResult } from "./SandboxExecutionEngine";
import { llmRouter } from "./llmRouter";
import { SchemaContextCacheService } from "./SchemaContextCacheService";
import { PythonStatisticalGuardrailsService, GuardrailCheckResult } from "./PythonStatisticalGuardrailsService";
import { PythonASTStaticValidatorService, ASTValidationResult } from "./PythonASTStaticValidatorService";

export interface SelfHealingExecutionOptions extends SandboxExecutionOptions {
  maxRetries?: number;
  availableColumns?: string[];
}

export interface SelfHealingExecutionResult {
  success: boolean;
  codeExecuted: string;
  originalCode?: string;
  attemptCount: number;
  healedSuccessfully: boolean;
  executionResult: SandboxExecutionResult;
  guardrailsReport?: GuardrailCheckResult;
  astValidationReport?: ASTValidationResult;
  errorTraceHistory: { attempt: number; error: string; code: string }[];
}

/**
 * Enterprise Self-Healing Code Agent
 * Executes Python/SQL in the sandbox environment.
 * If execution encounters a runtime exception (KeyError, ValueError, SyntaxError)
 * or fails Statistical Guardrails (NaN, negative revenue, zero variance),
 * feeds error/warnings back to LLM, auto-corrects using vectorized templates, and re-executes.
 */
export class SelfHealingCodeAgentService {
  private static readonly DEFAULT_MAX_RETRIES = 2;

  /**
   * Executes code with automated self-healing retry loop & statistical guardrail verification.
   */
  public static async executeWithSelfHealing(
    initialCode: string,
    options: SelfHealingExecutionOptions = {}
  ): Promise<SelfHealingExecutionResult> {
    const maxRetries = options.maxRetries ?? this.DEFAULT_MAX_RETRIES;
    const availableCols = options.availableColumns || [];
    
    let currentCode = initialCode;
    let attemptCount = 0;
    const errorTraceHistory: { attempt: number; error: string; code: string }[] = [];

    while (attemptCount <= maxRetries) {
      attemptCount++;
      console.log(`[SelfHealingAgent] Executing code attempt #${attemptCount}...`);

      // Upgrade 11: Zero-Shot AST Code Validation & Static Analysis
      const astCheck = PythonASTStaticValidatorService.validatePythonCode(currentCode);
      if (!astCheck.isValid) {
        console.warn(`[SelfHealingAgent] AST Static Analysis caught syntax errors before sandbox execution:`, astCheck.errors);
        const errorMessage = `[AST STATIC ANALYSIS SYNTAX ERRORS]: ${astCheck.errors.join("; ")}`;
        errorTraceHistory.push({
          attempt: attemptCount,
          error: errorMessage,
          code: currentCode,
        });

        if (attemptCount > maxRetries) {
          break;
        }

        // Fast re-prompt with AST error details
        const healingPrompt = `
You are Vivexa AI Self-Healing Python Code Agent.
Your Python script failed AST Static Analysis with syntax errors before sandbox execution:

--- AST STATIC ERRORS ---
${astCheck.errors.join("\n")}

--- FAILED PYTHON SCRIPT ---
${currentCode}

--- AVAILABLE DATASET COLUMNS ---
${availableCols.length > 0 ? availableCols.join(", ") : "Refer to columns loaded in DataFrame df"}

${SchemaContextCacheService.getVectorizedCodeTemplatesPromptSnippet()}

INSTRUCTIONS:
1. Fix all syntax, bracket, string, and indentation errors.
2. Return ONLY the corrected, complete Python code.
`;
        try {
          const llmResponse = await llmRouter.generateCompletion({
            provider: "GEMINI",
            modelName: "gemini-3.1-flash-lite",
            prompt: healingPrompt,
            temperature: 0.1,
          });
          const cleanCode = (llmResponse.text || "")
            .replace(/```python/gi, "")
            .replace(/```/g, "")
            .trim();
          if (cleanCode && cleanCode !== currentCode) {
            currentCode = cleanCode;
            continue;
          }
        } catch (err: any) {
          console.warn("[SelfHealingAgent] LLM self-healing call failed:", err.message);
          break;
        }
      }

      const res = await SandboxExecutionEngine.execute(currentCode, options);

      // Upgrade 4: Evaluate Statistical Guardrails on execution output
      const outputToValidate = res.data || res.stdout;
      const guardrailsReport = outputToValidate
        ? PythonStatisticalGuardrailsService.validateExecutionOutput(outputToValidate)
        : undefined;

      const isExecutionSuccessful = res.success && res.outputType !== "error";
      const passedGuardrails = !guardrailsReport || guardrailsReport.passed;

      if (isExecutionSuccessful && passedGuardrails) {
        console.log(`[SelfHealingAgent] Code executed cleanly and passed statistical guardrails on attempt #${attemptCount}!`);
        return {
          success: true,
          codeExecuted: currentCode,
          originalCode: attemptCount > 1 ? initialCode : undefined,
          attemptCount,
          healedSuccessfully: attemptCount > 1,
          executionResult: res,
          guardrailsReport,
          errorTraceHistory,
        };
      }

      // Capture Error Trace & Guardrail Failures
      let errorMessage = res.stderr || res.error?.message || "";
      if (!passedGuardrails && guardrailsReport) {
        errorMessage += `\n[STATISTICAL GUARDRAIL WARNINGS]: ${guardrailsReport.warnings.join("; ")}`;
      }
      if (!errorMessage) errorMessage = "Execution exception or statistical anomaly in sandbox.";

      console.warn(`[SelfHealingAgent] Attempt #${attemptCount} failed check: ${errorMessage}`);
      
      errorTraceHistory.push({
        attempt: attemptCount,
        error: errorMessage,
        code: currentCode,
      });

      // If max retries reached, return failure
      if (attemptCount > maxRetries) {
        break;
      }

      // Upgrade 3: Self-Healing Prompt Formulation with Vectorized Templates
      console.log(`[SelfHealingAgent] Feeding error trace and vectorized AST templates to Gemini Flash for self-healing code fix...`);
      const healingPrompt = `
You are Vivexa AI Self-Healing Python Code Agent.
Your previous Python script failed execution/guardrails in the sandbox environment with the following trace:

--- EXECUTION ERROR / GUARDRAIL WARNINGS ---
${errorMessage}

--- FAILED PYTHON SCRIPT ---
${currentCode}

--- AVAILABLE DATASET COLUMNS ---
${availableCols.length > 0 ? availableCols.join(", ") : "Refer to columns loaded in DataFrame df"}

${SchemaContextCacheService.getVectorizedCodeTemplatesPromptSnippet()}

INSTRUCTIONS:
1. Fix the error (e.g. fix column name typos, handle missing data/NaNs, fix imports, fix syntax, prevent negative metrics).
2. Return ONLY the corrected, complete Python code. Do not wrap in markdown quotes if possible, or provide valid script inside \`\`\`python ... \`\`\`.
`;

      try {
        const llmResponse = await llmRouter.generateCompletion({
          provider: "GEMINI",
          modelName: "gemini-3.1-flash-lite", // Fast Flash model for self-healing
          prompt: healingPrompt,
          temperature: 0.1,
        });

        const rawFixedText = llmResponse.text || "";
        // Clean markdown backticks
        const cleanCode = rawFixedText
          .replace(/```python/gi, "")
          .replace(/```/g, "")
          .trim();

        if (cleanCode && cleanCode !== currentCode) {
          currentCode = cleanCode;
        } else {
          // If model returned same code or empty text, abort retries
          break;
        }
      } catch (err: any) {
        console.warn("[SelfHealingAgent] LLM self-healing call failed:", err.message);
        break;
      }
    }

    // Return final failed result after exhausting retries
    const finalRes = await SandboxExecutionEngine.execute(currentCode, options);
    const finalOutput = finalRes.data || finalRes.stdout;
    const finalGuardrails = finalOutput
      ? PythonStatisticalGuardrailsService.validateExecutionOutput(finalOutput)
      : undefined;

    return {
      success: false,
      codeExecuted: currentCode,
      originalCode: initialCode,
      attemptCount,
      healedSuccessfully: false,
      executionResult: finalRes,
      guardrailsReport: finalGuardrails,
      errorTraceHistory,
    };
  }
}
