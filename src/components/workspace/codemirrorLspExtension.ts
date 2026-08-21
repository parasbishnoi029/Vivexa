import { linter, Diagnostic } from "@codemirror/lint";
import { hoverTooltip, Tooltip } from "@codemirror/view";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { lspClient } from "@/lib/lspClient";

/**
 * Creates CodeMirror 6 Linter Extension for real-time Python/SQL diagnostics.
 */
export function createLSPLinter(language: "python" | "sql" | "markdown") {
  return linter((view) => {
    const code = view.state.doc.toString();
    const lspDiags = lspClient.getDiagnostics(code, language);

    const diagnostics: Diagnostic[] = lspDiags.map((d) => ({
      from: Math.max(0, Math.min(d.from, code.length)),
      to: Math.max(0, Math.min(d.to, code.length)),
      severity: d.severity,
      message: d.message,
      source: d.source,
    }));

    return diagnostics;
  });
}

/**
 * Creates CodeMirror 6 Hover Tooltip Extension for parameter signatures and docstrings.
 */
export function createLSPHoverTooltip(language: "python" | "sql" | "markdown") {
  return hoverTooltip((view, pos): Tooltip | null => {
    if (language === "markdown") return null;

    const code = view.state.doc.toString();
    const hoverInfo = lspClient.getHoverTooltip(code, pos, language);

    if (!hoverInfo) return null;

    return {
      pos,
      above: true,
      create() {
        const dom = document.createElement("div");
        dom.className =
          "bg-slate-900 border border-slate-700 text-slate-100 p-2.5 rounded-xl shadow-2xl text-xs font-mono space-y-1 z-50 max-w-sm pointer-events-auto";

        const header = document.createElement("div");
        header.className = "font-bold text-indigo-400 flex items-center justify-between";
        header.textContent = hoverInfo.type;

        const sig = document.createElement("div");
        sig.className = "text-emerald-300 font-semibold bg-slate-950 p-1.5 rounded border border-slate-800 break-words";
        sig.textContent = hoverInfo.signature;

        const doc = document.createElement("div");
        doc.className = "text-slate-300 text-[11px] leading-relaxed pt-1";
        doc.textContent = hoverInfo.docstring;

        dom.appendChild(header);
        dom.appendChild(sig);
        dom.appendChild(doc);

        return { dom };
      },
    };
  });
}

/**
 * Creates CodeMirror 6 Autocomplete Extension for smart completion triggers.
 */
export function createLSPAutocomplete(language: "python" | "sql" | "markdown") {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        if (language === "markdown") return null;

        const word = context.matchBefore(/\w*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;

        const items = lspClient.getCompletions(language);

        return {
          from: word.from,
          options: items.map((item) => ({
            label: item.label,
            type: item.type,
            detail: item.detail,
            boost: item.boost,
          })),
        };
      },
    ],
  });
}
