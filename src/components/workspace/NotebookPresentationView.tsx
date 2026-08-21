import React, { useMemo, useCallback } from "react";
import {
  Presentation, EyeOff, Download, Printer, Share2, Sparkles,
  Layers, ArrowLeft, ArrowRight, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Notebook } from "@/stores/workspaceStore";
import Markdown from "react-markdown";
import { NotebookTableOutput } from "./NotebookTableOutput";

interface NotebookPresentationViewProps {
  notebook: Notebook;
  datasetName?: string;
  onExit: () => void;
}

const NotebookPresentationViewComponent: React.FC<NotebookPresentationViewProps> = ({
  notebook,
  datasetName,
  onExit,
}) => {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const shareReportLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Executive report link copied to clipboard!");
  }, []);

  // Filter cells that have meaningful visual output or are markdown sections
  const reportCells = useMemo(() => {
    return notebook.cells.filter(
      (c) => c.type === "markdown" || (c.output && c.output.type !== "error")
    );
  }, [notebook.cells]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Presentation Controls Bar */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl shadow-2xl print:hidden sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Presentation className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">{notebook.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                Executive Presentation Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Clean, distraction-free view hiding code syntax for stakeholder reporting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={shareReportLink}
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white rounded-xl"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white rounded-xl"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
          </Button>
          <Button
            onClick={onExit}
            size="sm"
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
          >
            <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Exit Presentation Mode
          </Button>
        </div>
      </div>

      {/* Cover Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-8 rounded-3xl border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> Vivexa AI Decision Intelligence Executive Report
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{notebook.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div>
            Data Source: <span className="font-semibold text-slate-200">{datasetName || "Enterprise Lakehouse"}</span>
          </div>
          <div>•</div>
          <div>
            Generated: <span className="font-semibold text-slate-200">{new Date().toLocaleDateString()}</span>
          </div>
          <div>•</div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified Computations
          </div>
        </div>
      </div>

      {/* Report Elements Flow */}
      <div className="space-y-8">
        {reportCells.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-500 text-sm">
            No executed outputs or markdown notes found in this notebook. Run your cells to generate charts and tables!
          </div>
        ) : (
          reportCells.map((cell, idx) => (
            <div
              key={cell.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-xl"
            >
              {cell.type === "markdown" ? (
                <div className="prose prose-invert prose-slate max-w-none text-slate-200">
                  <Markdown>{cell.code}</Markdown>
                </div>
              ) : (
                <div className="space-y-4">
                  {cell.output?.type === "table" && cell.output.data && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Statistical Result Matrix
                      </div>
                      <NotebookTableOutput data={cell.output.data} />
                    </div>
                  )}

                  {cell.output?.type === "chart" && cell.output.images && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Analytical Distribution Charts
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {cell.output.images.map((imgB64, i) => (
                          <div
                            key={i}
                            className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center max-w-2xl mx-auto"
                          >
                            <img
                              src={`data:image/png;base64,${imgB64}`}
                              referrerPolicy="no-referrer"
                              alt={`Chart ${i + 1}`}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cell.output?.type === "text" && (
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-850 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {cell.output.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const NotebookPresentationView = React.memo(NotebookPresentationViewComponent);
export default NotebookPresentationView;
