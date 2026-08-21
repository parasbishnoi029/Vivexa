import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  Keyboard,
  X,
  Sparkles,
} from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Execution" | "Navigation" | "Cell Operations" | "Modes" | "Kernel & System";
  mode?: "Command" | "Edit" | "Both";
}

const SHORTCUT_LIST: ShortcutItem[] = [
  // Execution
  {
    keys: ["Shift", "Enter"],
    description: "Run active cell and advance to next cell (inserts below if at end)",
    category: "Execution",
    mode: "Both",
  },
  {
    keys: ["Ctrl", "Enter"],
    description: "Run active cell in place (keep focus on current cell)",
    category: "Execution",
    mode: "Both",
  },
  {
    keys: ["Alt", "Enter"],
    description: "Run active cell, insert new cell below, and focus into it",
    category: "Execution",
    mode: "Both",
  },

  // Modes
  {
    keys: ["Esc"],
    description: "Switch to Command Mode (unfocus editor, enable single-key shortcuts)",
    category: "Modes",
    mode: "Edit",
  },
  {
    keys: ["Enter"],
    description: "Switch to Edit Mode (focus editor in active cell)",
    category: "Modes",
    mode: "Command",
  },
  {
    keys: ["Ctrl+M"],
    description: "Jupyter chord prefix (activates Chord mode for secondary letter commands)",
    category: "Modes",
    mode: "Both",
  },

  // Cell Operations (Command Mode)
  {
    keys: ["A", "or", "Ctrl+M A"],
    description: "Insert a new Python code cell above current cell",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["B", "or", "Ctrl+M B"],
    description: "Insert a new Python code cell below current cell",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["D", "D", "or", "Ctrl+M D"],
    description: "Delete current active cell (double-tap 'D' in Command Mode)",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["Y", "or", "Ctrl+M Y"],
    description: "Change current cell type to Python Code",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["M", "or", "Ctrl+M M"],
    description: "Change current cell type to Markdown (Rich text/Documentation)",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["Q", "or", "Ctrl+M Q"],
    description: "Change current cell type to DuckDB SQL Query",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["C", "or", "Ctrl+M C"],
    description: "Copy active cell to internal clipboard buffer",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["V", "or", "Ctrl+M V"],
    description: "Paste copied cell below current selection",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["X", "or", "Ctrl+M X"],
    description: "Cut active cell to clipboard buffer",
    category: "Cell Operations",
    mode: "Command",
  },
  {
    keys: ["Z"],
    description: "Undo last cell operation or state mutation",
    category: "Cell Operations",
    mode: "Command",
  },

  // Navigation
  {
    keys: ["K", "or", "Up"],
    description: "Select cell above",
    category: "Navigation",
    mode: "Command",
  },
  {
    keys: ["J", "or", "Down"],
    description: "Select cell below",
    category: "Navigation",
    mode: "Command",
  },
  {
    keys: ["Shift", "K", "or", "Shift", "Up"],
    description: "Move active cell upward in notebook hierarchy",
    category: "Navigation",
    mode: "Command",
  },
  {
    keys: ["Shift", "J", "or", "Shift", "Down"],
    description: "Move active cell downward in notebook hierarchy",
    category: "Navigation",
    mode: "Command",
  },
  {
    keys: ["F", "or", "Ctrl+F"],
    description: "Open notebook-wide Find & Replace search bar",
    category: "Navigation",
    mode: "Both",
  },

  // Kernel & System
  {
    keys: ["0", "0", "or", "Ctrl+M I"],
    description: "Restart WebAssembly Python kernel runtime & reset state",
    category: "Kernel & System",
    mode: "Command",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Save snapshot version of active notebook",
    category: "Kernel & System",
    mode: "Both",
  },
  {
    keys: ["H", "or", "?"],
    description: "Open this Jupyter Keyboard Shortcuts cheatsheet dialog",
    category: "Kernel & System",
    mode: "Command",
  },
];

interface NotebookShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotebookShortcutsModal: React.FC<NotebookShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Execution", "Modes", "Cell Operations", "Navigation", "Kernel & System"];

  const filteredShortcuts = useMemo(() => {
    return SHORTCUT_LIST.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const query = search.toLowerCase();
      const matchSearch =
        !search ||
        item.description.toLowerCase().includes(query) ||
        item.keys.some((k) => k.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="max-w-3xl w-full bg-slate-900 border border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl rounded-2xl relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Jupyter IDE Keyboard Shortcuts
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-normal flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Standard Jupyter & Chords
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute code, navigate cells, and orchestrate analysis pipelines without leaving the keyboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search shortcuts (e.g. 'insert above', 'Shift+Enter', 'markdown')..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-950 border-slate-800 rounded-xl focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Shortcuts Table */}
            <div className="p-4 max-h-[420px] overflow-y-auto custom-scrollbar space-y-2">
              {filteredShortcuts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No shortcuts found matching &quot;{search}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredShortcuts.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-amber-500/30 transition-all gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-xs text-slate-200 font-medium leading-snug">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {item.category}
                          </span>
                          {item.mode && (
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                item.mode === "Command"
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : item.mode === "Edit"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}
                            >
                              {item.mode} Mode
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kIdx) =>
                          k === "or" ? (
                            <span key={kIdx} className="text-[10px] text-slate-500 font-sans px-0.5">
                              or
                            </span>
                          ) : (
                            <kbd
                              key={kIdx}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-750 text-slate-200 font-mono text-[11px] font-bold shadow-sm"
                            >
                              {k}
                            </kbd>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Command Mode:{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[10px] text-white">Esc</kbd>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Edit Mode:{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[10px] text-white">Enter</kbd>
                </span>
              </div>
              <Button
                onClick={onClose}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 h-8 rounded-xl"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
