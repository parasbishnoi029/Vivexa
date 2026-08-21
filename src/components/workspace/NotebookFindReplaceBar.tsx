import React, { useState, useMemo, useCallback } from "react";
import { Search, Replace, ChevronUp, ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Cell } from "@/stores/workspaceStore";

interface NotebookFindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  cells: Cell[];
  onReplaceInCell: (cellId: string, newCode: string) => void;
  onReplaceAll: (searchTerm: string, replaceTerm: string) => void;
  onJumpToCell: (cellId: string) => void;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const NotebookFindReplaceBarComponent: React.FC<NotebookFindReplaceBarProps> = ({
  isOpen,
  onClose,
  cells,
  onReplaceInCell,
  onReplaceAll,
  onJumpToCell,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  // Find all matches across cells
  const matches = useMemo(() => {
    if (!searchTerm) return [];
    const escaped = escapeRegExp(searchTerm);
    const regex = new RegExp(escaped, "gi");
    return cells
      .map((cell, cIdx) => {
        const count = (cell.code.match(regex) || []).length;
        return count > 0 ? { cellId: cell.id, cellIdx: cIdx, count } : null;
      })
      .filter(Boolean) as Array<{ cellId: string; cellIdx: number; count: number }>;
  }, [cells, searchTerm]);

  const totalMatchCount = useMemo(() => {
    return matches.reduce((acc, m) => acc + m.count, 0);
  }, [matches]);

  const handleNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const nextIdx = (matchIndex + 1) % matches.length;
    setMatchIndex(nextIdx);
    onJumpToCell(matches[nextIdx].cellId);
  }, [matches, matchIndex, onJumpToCell]);

  const handlePrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    const prevIdx = (matchIndex - 1 + matches.length) % matches.length;
    setMatchIndex(prevIdx);
    onJumpToCell(matches[prevIdx].cellId);
  }, [matches, matchIndex, onJumpToCell]);

  const handleReplaceCurrent = useCallback(() => {
    if (matches.length === 0 || !searchTerm) return;
    const current = matches[matchIndex];
    const cell = cells.find((c) => c.id === current.cellId);
    if (!cell) return;

    const regex = new RegExp(escapeRegExp(searchTerm), "i");
    const updated = cell.code.replace(regex, replaceTerm);
    onReplaceInCell(cell.id, updated);
    toast.success("Replaced occurrence.");
  }, [matches, matchIndex, searchTerm, replaceTerm, cells, onReplaceInCell]);

  const handleReplaceAllClick = useCallback(() => {
    if (!searchTerm || totalMatchCount === 0) {
      toast.info("No matches to replace.");
      return;
    }
    onReplaceAll(searchTerm, replaceTerm);
    toast.success(`Replaced ${totalMatchCount} occurrences across ${matches.length} cells.`);
  }, [searchTerm, totalMatchCount, onReplaceAll, replaceTerm, matches.length]);

  if (!isOpen) return null;

  return (
    <div className="bg-slate-900/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setMatchIndex(0);
            }}
            placeholder="Find in notebook..."
            className="h-8 pl-8 text-xs bg-slate-950 border-slate-800 rounded-lg text-slate-200"
            autoFocus
          />
        </div>

        <div className="relative flex-1">
          <Replace className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace with..."
            className="h-8 pl-8 text-xs bg-slate-950 border-slate-800 rounded-lg text-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
          {matches.length > 0
            ? `${matchIndex + 1} of ${matches.length} cells (${totalMatchCount} matches)`
            : searchTerm
            ? "0 matches"
            : "Type to search"}
        </span>

        <Button
          onClick={handlePrevMatch}
          disabled={matches.length === 0}
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
          title="Previous Match"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleNextMatch}
          disabled={matches.length === 0}
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
          title="Next Match"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleReplaceCurrent}
          disabled={matches.length === 0 || !searchTerm}
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white rounded-lg disabled:opacity-30"
        >
          Replace
        </Button>
        <Button
          onClick={handleReplaceAllClick}
          disabled={matches.length === 0 || !searchTerm}
          size="sm"
          className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg disabled:opacity-30"
        >
          Replace All
        </Button>

        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-lg text-slate-400 hover:text-white ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const NotebookFindReplaceBar = React.memo(NotebookFindReplaceBarComponent);
export default NotebookFindReplaceBar;

