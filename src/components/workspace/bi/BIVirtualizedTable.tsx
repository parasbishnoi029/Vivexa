import React, { useRef, useState } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, Columns, FileSpreadsheet, Search, ArrowUpDown, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BIVirtualizedTableProps {
  sortedFilteredRows: Record<string, any>[];
  totalFilteredCount: number;
  totalDatasetCount: number;
  visibleColumns: string[];
  dimensions: string[];
  tableSortCol: string | null;
  tableSortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onToggleDimensionFilter: (dim: string, val: string) => void;
  onOpenColumnSelector: () => void;
  onExportCSV: () => void;
}

function BIVirtualizedTableComponent({
  sortedFilteredRows,
  totalFilteredCount,
  totalDatasetCount,
  visibleColumns,
  dimensions,
  tableSortCol,
  tableSortDir,
  onSort,
  onToggleDimensionFilter,
  onOpenColumnSelector,
  onExportCSV
}: BIVirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedFilteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden">
      <CardHeader className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-indigo-400" />
          <div>
            <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
              High-Velocity Data Grid
            </CardTitle>
            <span className="text-[10px] text-slate-400 font-mono">
              Virtualizing {totalFilteredCount.toLocaleString()} of {totalDatasetCount.toLocaleString()} records • 60 FPS Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onOpenColumnSelector}
            className="h-7 text-[11px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
          >
            <Columns className="h-3 w-3 mr-1" /> Columns ({visibleColumns.length})
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onExportCSV}
            className="h-7 text-[11px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
          >
            <FileSpreadsheet className="h-3 w-3 mr-1" /> Export Table
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 relative min-h-[380px]">
        {/* Dynamic Header Row with Interactive Sorting */}
        <div 
          className="grid text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 p-3 border-b border-slate-800 sticky top-0 z-10 font-mono"
          style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(130px, 1fr))` }}
        >
          {visibleColumns.map((col) => {
            const isSorted = tableSortCol === col;
            return (
              <div 
                key={col} 
                onClick={() => onSort(col)}
                className="truncate px-1.5 cursor-pointer hover:text-indigo-300 flex items-center gap-1 transition-colors select-none"
                title="Click to Sort"
              >
                <span>{col.replace(/_/g, " ")}</span>
                {isSorted ? (
                  <span className="text-indigo-400 font-bold">{tableSortDir === 'asc' ? '▲' : '▼'}</span>
                ) : (
                  <ArrowUpDown className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
                )}
              </div>
            );
          })}
        </div>

        {/* 60 FPS Virtualized Body */}
        <div 
          ref={parentRef}
          className="h-[340px] overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          {sortedFilteredRows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 italic p-8 space-y-2">
              <Filter className="h-6 w-6 text-slate-600 mb-1" />
              <span>No transactions match the selected filters or search terms.</span>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = sortedFilteredRows[virtualRow.index];
                if (!row) return null;

                return (
                  <div
                    key={virtualRow.index}
                    className="absolute top-0 left-0 w-full grid text-[11px] text-slate-300 p-2.5 border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors items-center font-mono"
                    style={{
                      gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(130px, 1fr))`,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {visibleColumns.map((col, cIdx) => {
                      const val = row[col];
                      const isAmount = typeof val === "number" && (
                        col.toLowerCase().includes("amount") || col.toLowerCase().includes("rev") || 
                        col.toLowerCase().includes("price") || col.toLowerCase().includes("cost") || 
                        col.toLowerCase().includes("profit") || col.toLowerCase().includes("value")
                      );
                      const isDim = dimensions.includes(col);

                      return (
                        <div 
                          key={col} 
                          onClick={() => {
                            if (isDim && val !== null && val !== undefined) {
                              onToggleDimensionFilter(col, String(val));
                            }
                          }}
                          className={`truncate px-1.5 ${isDim ? 'cursor-pointer hover:text-indigo-400 hover:underline' : ''}`}
                          title={String(val ?? "-")}
                        >
                          {cIdx === 0 ? (
                            <span className="text-indigo-400 font-bold">{String(val)}</span>
                          ) : isAmount ? (
                            <span className="text-emerald-400 font-bold">${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span>{String(val ?? "-")}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const BIVirtualizedTable = React.memo(BIVirtualizedTableComponent);
