import { useRef, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { pyodideSandbox } from "@/lib/pyodideSandbox";
import { AdaptiveQueryRouter } from "@/lib/adaptiveQueryRouter";
import { toast } from "sonner";

export interface CellExecutionMeta {
  durationMs: number;
  timestamp: string;
}

export function useNotebookExecution() {
  const {
    notebooks,
    setNotebooks,
    activeNbId,
    selectedDataset,
    setKernelStatus,
  } = useWorkspaceStore();

  const [cellExecutionMeta, setCellExecutionMeta] = useState<Record<string, CellExecutionMeta>>({});
  const [markdownEditModes, setMarkdownEditModes] = useState<Record<string, boolean>>({});
  const [cellRuntimes, setCellRuntimes] = useState<Record<string, "wasm" | "microvm">>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const executeCell = useCallback(
    async (cellId: string, hybridComputeEngine: "wasm" | "container" | "dwh" = "wasm") => {
      const activeNb = notebooks.find((nb) => nb.id === activeNbId);
      if (!activeNb) return;

      const controller = new AbortController();
      abortControllersRef.current[cellId] = controller;

      const startTime = performance.now();
      setKernelStatus("Busy");
      setNotebooks((prev) =>
        prev.map((nb) => {
          if (nb.id !== activeNbId) return nb;
          return {
            ...nb,
            cells: nb.cells.map((c) => (c.id === cellId ? { ...c, isExecuting: true } : c)),
          };
        })
      );

      const cell = activeNb.cells.find((c) => c.id === cellId);
      if (!cell) {
        delete abortControllersRef.current[cellId];
        setKernelStatus("Idle");
        return;
      }

      // Markdown toggle
      if (cell.type === "markdown") {
        delete abortControllersRef.current[cellId];
        setMarkdownEditModes((prev) => {
          const isCurrentlyEditing = prev[cellId] ?? !cell.output;
          return { ...prev, [cellId]: !isCurrentlyEditing };
        });
        setNotebooks((prev) =>
          prev.map((nb) => {
            if (nb.id !== activeNbId) return nb;
            return {
              ...nb,
              cells: nb.cells.map((c) =>
                c.id === cellId
                  ? { ...c, isExecuting: false, output: { type: "markdown", text: c.code } }
                  : c
              ),
            };
          })
        );
        setKernelStatus("Idle");
        return;
      }

      // Python execution
      if (cell.type === "python") {
        if (cellRuntimes[cellId] === "microvm") {
          try {
            const response = await fetch("/api/v1/enterprise/microvm/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: cell.code, timeoutSec: 60 }),
            });
            const data = await response.json();
            const endTime = performance.now();
            const execTime = ((endTime - startTime) / 1000).toFixed(2);
            const durationMs = Math.round(endTime - startTime);

            setCellExecutionMeta((prev) => ({
              ...prev,
              [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() },
            }));

            if (data.success) {
              setNotebooks((prev) =>
                prev.map((nb) => {
                  if (nb.id !== activeNbId) return nb;
                  return {
                    ...nb,
                    cells: nb.cells.map((c) =>
                      c.id === cellId
                        ? {
                            ...c,
                            isExecuting: false,
                            executionTime: execTime + "s",
                            output: {
                              type: "text" as const,
                              text:
                                (data.stdout || "Execution completed successfully.").trim() +
                                `\n\n[MicroVM Pod: ${data.podId || "gVisor-isolated"} | ${
                                  data.peakMemoryMb || 14
                                }MB RAM | Execution: ${data.executionTimeMs || durationMs}ms]`,
                            },
                          }
                        : c
                    ),
                  };
                })
              );
              setKernelStatus("Idle");
              delete abortControllersRef.current[cellId];
              return;
            }
          } catch (vmErr) {
            toast.warning("MicroVM pod network error, switching to Pyodide WASM worker.");
          }
        }

        // Pyodide Isolated WASM Python Sandboxing Execution via Dedicated WebWorker
        try {
          const datasetRows =
            (selectedDataset as any)?.sample_rows || (selectedDataset as any)?.preview_data || undefined;

          let pyResult: any;
          if (hybridComputeEngine === "wasm" || !cellRuntimes[cellId]) {
            const { executeInDedicatedWorker } = await import("@/workers/dedicatedComputeWorker");
            const workerRes = await executeInDedicatedWorker({
              type: "python",
              code: cell.code,
              dataSample: datasetRows,
            });

            pyResult = {
              securityBlocked: !workerRes.success && workerRes.error?.includes("system"),
              error: workerRes.error,
              stdout: workerRes.result?.stdout || "",
              stderr: workerRes.error || "",
              result: workerRes.result?.data || null,
            };
          } else {
            pyResult = await pyodideSandbox.execute(cellId, cell.code, datasetRows);
          }

          const endTime = performance.now();
          const execTime = ((endTime - startTime) / 1000).toFixed(2);
          const durationMs = Math.round(endTime - startTime);

          setCellExecutionMeta((prev) => ({
            ...prev,
            [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() },
          }));

          setNotebooks((prev) =>
            prev.map((nb) => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map((c) => {
                  if (c.id !== cellId) return c;

                  if (pyResult.securityBlocked) {
                    return {
                      ...c,
                      isExecuting: false,
                      executionTime: execTime + "s",
                      output: {
                        type: "error" as const,
                        error: {
                          error_class: "SecuritySandboxViolation",
                          message: pyResult.error || "Blocked dangerous system access attempt.",
                          line_number: null,
                          suggested_fix:
                            "System syscalls are blocked by the Zero-Trust sandbox. Use pandas, numpy, scipy, and matplotlib.",
                        },
                      },
                    };
                  }

                  if (pyResult.error) {
                    return {
                      ...c,
                      isExecuting: false,
                      executionTime: execTime + "s",
                      output: {
                        type: "error" as const,
                        error: {
                          error_class: "PythonExecutionError",
                          message: pyResult.error,
                          line_number: null,
                          suggested_fix: "Check your variable references and python syntax.",
                          traceback: pyResult.stderr,
                        },
                      },
                    };
                  }

                  if (pyResult.result && Array.isArray(pyResult.result) && pyResult.result.length > 0) {
                    const columns = Object.keys(pyResult.result[0]);
                    return {
                      ...c,
                      isExecuting: false,
                      executionTime: execTime + "s",
                      output: {
                        type: "table" as const,
                        columns,
                        rows: pyResult.result,
                        text: `DataFrame: ${pyResult.result.length} rows processed.`,
                      },
                    };
                  }

                  return {
                    ...c,
                    isExecuting: false,
                    executionTime: execTime + "s",
                    output: {
                      type: "text" as const,
                      text: pyResult.stdout || "Execution completed successfully.",
                    },
                  };
                }),
              };
            })
          );
        } catch (pyErr: any) {
          const endTime = performance.now();
          setNotebooks((prev) =>
            prev.map((nb) => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map((c) =>
                  c.id === cellId
                    ? {
                        ...c,
                        isExecuting: false,
                        executionTime: `${((endTime - startTime) / 1000).toFixed(2)}s`,
                        output: {
                          type: "error" as const,
                          error: {
                            error_class: "ExecutionError",
                            message: pyErr.message || "Failed during execution",
                            line_number: null,
                            suggested_fix: "Verify syntax and variable scope.",
                          },
                        },
                      }
                    : c
                ),
              };
            })
          );
        } finally {
          setKernelStatus("Idle");
          delete abortControllersRef.current[cellId];
        }
        return;
      }

      // SQL execution
      if (cell.type === "sql") {
        try {
          const datasetRows =
            (selectedDataset as any)?.sample_rows ||
            (selectedDataset as any)?.preview_data ||
            (selectedDataset as any)?.rows ||
            undefined;
          const datasetInfo = selectedDataset
            ? {
                id: selectedDataset.id,
                name: selectedDataset.name,
                rowCount: (selectedDataset as any).row_count || datasetRows?.length || 10000,
                sizeBytes: (selectedDataset as any).size_bytes || 5000000,
                storageType: (selectedDataset as any).storage_type || "local_wasm",
                remoteWarehouseUrl: (selectedDataset as any).remote_warehouse_url,
              }
            : undefined;

          const routerResult = await AdaptiveQueryRouter.execute(cell.code, datasetInfo, datasetRows);
          const durationMs = routerResult.durationMs || Math.round(performance.now() - startTime);

          setCellExecutionMeta((prev) => ({
            ...prev,
            [cellId]: { durationMs, timestamp: new Date().toLocaleTimeString() },
          }));

          setNotebooks((prev) =>
            prev.map((nb) => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map((c) => {
                  if (c.id !== cellId) return c;

                  if (!routerResult.success) {
                    return {
                      ...c,
                      isExecuting: false,
                      executionTime: `${(durationMs / 1000).toFixed(2)}s`,
                      output: {
                        type: "error" as const,
                        error: {
                          error_class: "SQLQueryError",
                          message: routerResult.error || "Query execution failed.",
                          suggested_fix: "Check your SQL table alias and clause syntax.",
                          line_number: null,
                        },
                      },
                    };
                  }

                  if (routerResult.columns && routerResult.rows) {
                    return {
                      ...c,
                      isExecuting: false,
                      executionTime: `${(durationMs / 1000).toFixed(2)}s`,
                      output: {
                        type: "table" as const,
                        columns: routerResult.columns,
                        rows: routerResult.rows,
                        text: `[${
                          routerResult.engine === "Cloud-Warehouse-Pushdown"
                            ? "⚡ Remote Warehouse Pushdown"
                            : "🦆 DuckDB-WASM Local"
                        }] ${routerResult.rowCount} rows retrieved in ${durationMs}ms.`,
                      },
                    };
                  }

                  return {
                    ...c,
                    isExecuting: false,
                    executionTime: `${(durationMs / 1000).toFixed(2)}s`,
                    output: {
                      type: "text" as const,
                      text: "Query executed successfully.",
                    },
                  };
                }),
              };
            })
          );
        } catch (sqlErr: any) {
          setNotebooks((prev) =>
            prev.map((nb) => {
              if (nb.id !== activeNbId) return nb;
              return {
                ...nb,
                cells: nb.cells.map((c) =>
                  c.id === cellId
                    ? {
                        ...c,
                        isExecuting: false,
                        executionTime: "0.01s",
                        output: {
                          type: "error" as const,
                          error: {
                            error_class: "SQLRouterError",
                            message: sqlErr.message || "Query routing exception",
                            suggested_fix: "Verify SQL query structure and aliases.",
                            line_number: null,
                          },
                        },
                      }
                    : c
                ),
              };
            })
          );
        } finally {
          setKernelStatus("Idle");
          delete abortControllersRef.current[cellId];
        }
      }
    },
    [notebooks, activeNbId, selectedDataset, setNotebooks, setKernelStatus, cellRuntimes]
  );

  const cancelCellExecution = useCallback(
    (cellId: string) => {
      if (abortControllersRef.current[cellId]) {
        abortControllersRef.current[cellId].abort();
        delete abortControllersRef.current[cellId];
      }
      setNotebooks((prev) =>
        prev.map((nb) => {
          if (nb.id !== activeNbId) return nb;
          return {
            ...nb,
            cells: nb.cells.map((c) =>
              c.id === cellId
                ? {
                    ...c,
                    isExecuting: false,
                    output: {
                      type: "text" as const,
                      text: "Execution cancelled by user interrupt signal.",
                    },
                  }
                : c
            ),
          };
        })
      );
      setKernelStatus("Idle");
      toast.info("Cell execution interrupted.");
    },
    [activeNbId, setNotebooks, setKernelStatus]
  );

  const clearOutput = useCallback(
    (cellId: string) => {
      setNotebooks((prev) =>
        prev.map((nb) => {
          if (nb.id !== activeNbId) return nb;
          return {
            ...nb,
            cells: nb.cells.map((c) => (c.id === cellId ? { ...c, output: undefined } : c)),
          };
        })
      );
    },
    [activeNbId, setNotebooks]
  );

  const clearAllOutputs = useCallback(() => {
    setNotebooks((prev) =>
      prev.map((nb) => {
        if (nb.id !== activeNbId) return nb;
        return {
          ...nb,
          cells: nb.cells.map((c) => ({ ...c, output: undefined })),
        };
      })
    );
    toast.success("Cleared all cell outputs.");
  }, [activeNbId, setNotebooks]);

  return {
    executeCell,
    cancelCellExecution,
    clearOutput,
    clearAllOutputs,
    cellExecutionMeta,
    markdownEditModes,
    setMarkdownEditModes,
    cellRuntimes,
    setCellRuntimes,
  };
}
