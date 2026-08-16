import React from "react";
import { X, CheckSquare, Square, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColumnSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: string[];
  visibleColumns: string[];
  onChangeVisibleColumns: (cols: string[]) => void;
}

export function ColumnSelectorModal({
  isOpen,
  onClose,
  allColumns,
  visibleColumns,
  onChangeVisibleColumns
}: ColumnSelectorModalProps) {
  if (!isOpen) return null;

  const toggleColumn = (col: string) => {
    if (visibleColumns.includes(col)) {
      if (visibleColumns.length <= 1) return; // Keep at least one
      onChangeVisibleColumns(visibleColumns.filter(c => c !== col));
    } else {
      onChangeVisibleColumns([...visibleColumns, col]);
    }
  };

  const handleSelectAll = () => {
    onChangeVisibleColumns(allColumns);
  };

  const handleResetDefault = () => {
    onChangeVisibleColumns(allColumns.slice(0, 8));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Columns className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Data Grid Columns ({visibleColumns.length}/{allColumns.length})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <button 
            type="button" 
            onClick={handleSelectAll} 
            className="text-indigo-400 hover:underline font-semibold"
          >
            Select All
          </button>
          <button 
            type="button" 
            onClick={handleResetDefault} 
            className="text-slate-400 hover:underline"
          >
            Reset (First 8)
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
          {allColumns.map((col) => {
            const isChecked = visibleColumns.includes(col);
            return (
              <div
                key={col}
                onClick={() => toggleColumn(col)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono cursor-pointer border transition-colors ${
                  isChecked 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-white" 
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isChecked ? (
                    <CheckSquare className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-600" />
                  )}
                  <span className="truncate">{col}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button size="sm" onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
            Done
          </Button>
        </div>

      </div>
    </div>
  );
}
