import React, { useState } from "react";
import Markdown from "react-markdown";
import {
  FileText, Play, Trash2, CopyPlus, ChevronUp, ChevronDown,
  Edit2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cell } from "@/stores/workspaceStore";
import { NotebookCellEditor } from "@/components/workspace/NotebookCellEditor";

export interface NotebookMarkdownCellProps {
  cell: Cell;
  index: number;
  isActive: boolean;
  notebookMode: "command" | "edit";
  onUpdateCode: (code: string) => void;
  onUpdateType: (type: "python" | "sql" | "markdown") => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export const NotebookMarkdownCell: React.FC<NotebookMarkdownCellProps> = ({
  cell,
  index,
  isActive,
  notebookMode,
  onUpdateCode,
  onUpdateType,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus,
  onBlur,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleRender = () => {
    setIsEditing(false);
  };

  return (
    <div
      id={cell.id}
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isActive
          ? "border-emerald-500/50 bg-slate-900/80 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
          : "border-slate-800/80 bg-slate-900/40 hover:border-slate-750"
      }`}
      onClick={() => {
        if (!isActive) onFocus();
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 rounded-t-2xl text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
            <FileText className="h-3 w-3" /> [Markdown #{index + 1}]
          </span>
          <span className="text-slate-500 text-[10px]">
            {isEditing ? "Editing Raw Markdown" : "Double-click to edit"}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <Button
              onClick={handleRender}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 rounded"
            >
              <Check className="h-3 w-3 mr-1" /> Render (Shift+Enter)
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] text-slate-400 hover:text-white rounded"
            >
              <Edit2 className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}

          <Button onClick={onMoveUp} variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" title="Move Up">
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={onMoveDown} variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" title="Move Down">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={onDuplicate} variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" title="Duplicate">
            <CopyPlus className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={onDelete} variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-400" title="Delete Cell">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div onKeyDown={(e) => {
            if (e.shiftKey && e.key === "Enter") {
              e.preventDefault();
              handleRender();
            }
          }}>
            <NotebookCellEditor
              cell={cell}
              index={index}
              isActive={isActive}
              notebookMode={notebookMode}
              isLockedByPeer={null}
              runtime="wasm"
              onRuntimeChange={() => {}}
              onExecute={handleRender}
              onRunAndAdvance={handleRender}
              onRunInPlace={handleRender}
              onRunAndInsertBelow={handleRender}
              onEnterCommandMode={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
              onRunAbove={() => {}}
              onRunBelow={() => {}}
              onUpdateCode={onUpdateCode}
              onUpdateType={onUpdateType}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onTriggerCopilot={() => {}}
              onQuickAiAction={() => {}}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="prose prose-invert prose-slate max-w-none text-slate-200 cursor-pointer min-h-[48px]"
          >
            {cell.code.trim() ? (
              <Markdown>{cell.code}</Markdown>
            ) : (
              <p className="text-slate-500 italic text-sm">Empty markdown cell. Double click to add notes, narrative, or headers.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
