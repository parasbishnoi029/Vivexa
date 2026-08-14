import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Database, Activity, ShieldCheck, Settings2, BarChart2, 
  PieChart, LineChart, FileSpreadsheet, ArrowLeft, 
  Download, Sparkles, Filter, Search, ChevronDown, CheckCircle2,
  AlertTriangle, XCircle, HardDrive, Clock, Trash2, Edit2, Layers,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RefreshCw, Cpu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { profileDataset, DatasetProfile } from "@/lib/dataEngine";
import { parseDatasetFile } from "@/lib/datasetParser";
import DataCleaningStudio from "@/components/workspace/DataCleaningStudio";
import InteractiveVisualizationStudio from "@/components/workspace/InteractiveVisualizationStudio";
import ExportPackModal from "@/components/workspace/ExportPackModal";
import { AnalysisValidatorCard } from "@/components/workspace/AnalysisValidatorCard";
import { ConfidenceScoreMetricCard } from "@/components/workspace/ConfidenceScoreMetricCard";
import StatisticalDiagnosticsView from "@/components/workspace/StatisticalDiagnosticsView";

const TABS = [
  { id: "viewer", label: "Data Preview", icon: FileSpreadsheet },
  { id: "profiling", label: "Automated Profiling & Quality", icon: Activity },
  { id: "diagnostics", label: "Statistical Diagnostics & Z-Scores", icon: ShieldCheck },
  { id: "cleaning", label: "Data Cleaning Studio", icon: Settings2 },
  { id: "visualizer", label: "Interactive Visualization Studio", icon: BarChart2 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DatasetDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("viewer");
  const [dataset, setDataset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fullRows, setFullRows] = useState<any[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Interactive Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Calculate memory usage (approx)
  const memoryUsageMB = useMemo(() => {
    if (!fullRows || fullRows.length === 0) return "0 MB";
    const bytes = JSON.stringify(fullRows).length;
    return (bytes / (1024 * 1024)).toFixed(4) + " MB";
  }, [fullRows]);

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    if (!fullRows || fullRows.length === 0) return [];
    let list = [...fullRows];

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        previewCols.some(col => String(r[col] ?? '').toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortCol) {
      list.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }
        const strA = String(valA ?? '').toLowerCase();
        const strB = String(valB ?? '').toLowerCase();
        return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return list;
  }, [fullRows, searchQuery, sortCol, sortDir, previewCols]);

  // Paginated Rows
  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    async function loadDataset() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('datasets').select('*').eq('id', id).single();
        if (error) throw error;
        setDataset(data);
        
        if (data && data.storage_path) {
          setIsPreviewLoading(true);
          const { data: fileData, error: fileError } = await supabase.storage.from('datasets').download(data.storage_path);
          if (!fileError && fileData) {
            try {
              const parsed = await parseDatasetFile(fileData, data.name);
              setFullRows(parsed.rows);
              setPreviewCols(parsed.columns);
              const computed = profileDataset(parsed.rows, data.name, { fileSize: data.size_bytes });
              setProfile(computed);
            } catch (parseErr: any) {
              console.error("[DATASET DETAIL] Parsing error:", parseErr);
              toast.error(`Failed to parse dataset '${data.name}': ${parseErr.message || String(parseErr)}`);
            }
          } else {
            console.error("[DATASET DETAIL] Download error:", fileError);
            toast.error("Failed to download dataset file from storage.");
          }
          setIsPreviewLoading(false);
        }
      } catch (err) {
        console.error("Failed to load dataset", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataset();
  }, [id]);

  const navigate = useNavigate();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  const handleDownload = async () => {
    if (!dataset || !dataset.storage_path) return;
    try {
      const { data, error } = await supabase.storage.from('datasets').download(dataset.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = dataset.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Dataset downloaded");
    } catch (err) {
      toast.error("Failed to download dataset");
    }
  };

  const handleDelete = async () => {
    if (!dataset) return;
    if (!confirm("Are you sure you want to delete this dataset?")) return;
    try {
      await supabase.storage.from('datasets').remove([dataset.storage_path]);
      const { error } = await supabase.from('datasets').delete().eq('id', dataset.id);
      if (error) throw error;
      toast.success("Dataset deleted");
      navigate('/workspace/datasets');
    } catch (err) {
      toast.error("Failed to delete dataset");
    }
  };

  const handleRename = async () => {
    if (!dataset || !newName.trim()) {
      setIsRenaming(false);
      return;
    }
    try {
      const { error } = await supabase.from('datasets').update({ name: newName }).eq('id', dataset.id);
      if (error) throw error;
      setDataset({ ...dataset, name: newName });
      toast.success("Dataset renamed");
    } catch (err) {
      toast.error("Failed to rename dataset");
    } finally {
      setIsRenaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex flex-col h-64 items-center justify-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-200">Dataset not found</h2>
        <Link to="/workspace/datasets" className="text-indigo-400 hover:underline">Back to datasets</Link>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 relative z-10">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 sm:p-6 rounded-2xl border border-slate-800/60 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <Link to="/workspace/datasets" className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-lg"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  />
                  <Button size="sm" onClick={handleRename} className="bg-indigo-600 hover:bg-indigo-700 h-8">Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsRenaming(false)} className="h-8">Cancel</Button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    {dataset.name}
                    <button onClick={() => { setIsRenaming(true); setNewName(dataset.name); }} className="text-slate-500 hover:text-white p-1">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </h1>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" /> {dataset.status || 'Ready'}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-4">
              <span>{fullRows.length} rows × {previewCols.length} columns</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{dataset.type || 'CSV'} format</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsExportOpen(true)} className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Pack
          </Button>
          <Button variant="outline" onClick={handleDelete} className="bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={() => navigate(`/workspace/ai?datasetId=${dataset.id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze with AI
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] border-transparent' 
                  : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                rounded-xl transition-all
              `}
            >
              <TabIcon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "viewer" && (
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl overflow-hidden flex flex-col min-h-[450px]">
              {/* Header & Controls Bar */}
              <CardHeader className="border-b border-slate-800/60 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-indigo-400" /> Interactive Data Grid Preview
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs mt-1">
                      Explore, search, sort, and inspect rows directly from the parsed single source of truth.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono">
                      <Cpu className="h-3.5 w-3.5 text-indigo-400" /> {memoryUsageMB}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-semibold">
                      {processedRows.length.toLocaleString()} / {fullRows.length.toLocaleString()} rows
                    </span>
                  </div>
                </div>

                {/* Filter & Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/60">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search across all columns..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="h-8 w-8 p-0 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-slate-300 font-mono px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="h-8 w-8 p-0 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto p-0">
                {isPreviewLoading ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center space-y-3">
                    <Activity className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-xs text-slate-400">Parsing binary buffer from storage...</p>
                  </div>
                ) : fullRows.length > 0 ? (
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="text-[11px] text-slate-300 uppercase bg-slate-950 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center text-slate-500 font-mono border-r border-slate-800/60">#</th>
                          {previewCols.map((col, i) => {
                            const colProfile = profile?.columns.find(c => c.name === col);
                            const colType = colProfile?.type || 'string';
                            const nullPct = colProfile ? colProfile.nullPercentage : 0;
                            const isSorted = sortCol === col;

                            return (
                              <th 
                                key={i} 
                                onClick={() => handleSort(col)}
                                className="px-4 py-2.5 font-bold whitespace-nowrap cursor-pointer hover:bg-slate-800/60 transition-colors border-r border-slate-800/40 select-none group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-white group-hover:text-indigo-300 transition-colors">{col}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-indigo-400 font-mono uppercase">
                                      {colType}
                                    </span>
                                    {isSorted ? (
                                      sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-400" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 text-slate-600 group-hover:text-slate-400" />
                                    )}
                                  </div>
                                </div>
                                {colProfile && (
                                  <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                                    {nullPct > 0 ? <span className="text-amber-400/80">{nullPct}% nulls</span> : <span className="text-emerald-400/80">100% complete</span>}
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.length > 0 ? (
                          paginatedRows.map((row, i) => {
                            const globalRowIdx = (currentPage - 1) * pageSize + i + 1;
                            return (
                              <tr key={i} className="border-b border-slate-800/40 hover:bg-indigo-950/20 transition-colors">
                                <td className="px-3 py-2 text-center text-slate-500 font-mono border-r border-slate-800/40 bg-slate-950/30">
                                  {globalRowIdx}
                                </td>
                                {previewCols.map((col, j) => {
                                  const val = row[col];
                                  const isNull = val === null || val === undefined || val === '';
                                  return (
                                    <td 
                                      key={j} 
                                      className="px-4 py-2 text-slate-300 truncate max-w-[220px] font-mono border-r border-slate-800/20"
                                      title={String(val ?? '')}
                                    >
                                      {isNull ? (
                                        <span className="italic text-slate-600 bg-slate-800/40 px-1.5 py-0.5 rounded">null</span>
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={previewCols.length + 1} className="py-12 text-center text-slate-500">
                              No matching rows found for query &quot;{searchQuery}&quot;.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col h-full min-h-[300px] items-center justify-center text-slate-500 space-y-3 p-8">
                    <FileSpreadsheet className="h-12 w-12 text-amber-500/40" />
                    <p className="text-sm text-slate-300 font-semibold">No parsed observations found in dataset.</p>
                    <p className="text-xs text-slate-500 max-w-md text-center">
                      The file buffer could not yield tabular observations or contains 0 rows. Verify the file format and structure.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "profiling" && profile && (
            <div className="space-y-6">
              {/* Scores Grid with AnalysisValidator Cross-Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ConfidenceScoreMetricCard
                  label="Data Quality"
                  score={profile.scores.dataQualityScore}
                  subtitle="Completeness & Integrity"
                  gradient="from-indigo-400 to-cyan-400"
                  validationReport={profile.validationReport}
                  metricKey="quality"
                  explanation={profile.scoreExplanations?.qualityFormula}
                />
                <ConfidenceScoreMetricCard
                  label="Completeness"
                  score={profile.scores.completenessScore}
                  subtitle="Null & Missing Ratios"
                  gradient="from-emerald-400 to-teal-400"
                  validationReport={profile.validationReport}
                  metricKey="completeness"
                  explanation={profile.scoreExplanations?.healthFormula}
                />
                <ConfidenceScoreMetricCard
                  label="Consistency"
                  score={profile.scores.consistencyScore}
                  subtitle="Outlier & Type Uniformity"
                  gradient="from-sky-400 to-blue-400"
                  validationReport={profile.validationReport}
                  metricKey="consistency"
                  explanation={profile.scoreExplanations?.riskAssessment}
                />
                <ConfidenceScoreMetricCard
                  label="ML Readiness"
                  score={profile.scores.mlReadinessScore}
                  subtitle="Feature Engineering Fit"
                  gradient="from-purple-400 to-pink-400"
                  validationReport={profile.validationReport}
                  metricKey="mlReadiness"
                  explanation={profile.scoreExplanations?.mlReadinessFormula}
                />
              </div>

              {/* Explanations Box */}
              <Card className="bg-slate-900/40 border-slate-800 p-6 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exact Calculation Formulas & Evidence</h3>
                <div className="space-y-2 text-xs text-slate-300 font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <p><strong className="text-indigo-400">Quality:</strong> {profile.scoreExplanations.qualityFormula}</p>
                  <p><strong className="text-emerald-400">Health:</strong> {profile.scoreExplanations.healthFormula}</p>
                  <p><strong className="text-purple-400">ML Readiness:</strong> {profile.scoreExplanations.mlReadinessFormula}</p>
                  <p><strong className="text-amber-400">Risk Assessment:</strong> {profile.scoreExplanations.riskAssessment}</p>
                </div>
              </Card>

              {/* Analysis Validator Service Multi-Pass Report */}
              <AnalysisValidatorCard report={profile.validationReport} />

              {/* Column Statistics Table */}
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white">Column Profiling Breakdown</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("diagnostics")}
                    className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    Open Z-Score Diagnostics
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 uppercase">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Column</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Nulls</th>
                        <th className="px-4 py-3 font-semibold">Uniques</th>
                        <th className="px-4 py-3 font-semibold">Min / Max</th>
                        <th className="px-4 py-3 font-semibold">Mean ± Std</th>
                        <th className="px-4 py-3 font-semibold">Outliers</th>
                        <th className="px-4 py-3 font-semibold text-rose-400">Domain Invalid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.columns.map((c, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-bold text-white">{c.name}</td>
                          <td className="px-4 py-3 text-indigo-400 uppercase">{c.type}</td>
                          <td className="px-4 py-3 text-slate-300">{c.nullCount} ({c.nullPercentage}%)</td>
                          <td className="px-4 py-3 text-slate-300">{c.uniqueCount}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {c.numericStats ? `${c.numericStats.min} / ${c.numericStats.max}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {c.numericStats ? `${c.numericStats.mean} ± ${c.numericStats.std}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-amber-400">
                            {c.numericStats ? `${c.numericStats.outlierCount} (${c.numericStats.outlierPercentage.toFixed(2)}%)` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-rose-400 font-bold">
                            {(c.domainInvalidCount && c.domainInvalidCount > 0) ? `${c.domainInvalidCount} Flagged` : 'None'}
                          </td>
                          <td className="px-4 py-3 text-rose-400 font-bold">
                            {(c.domainInvalidCount && c.domainInvalidCount > 0) ? `${c.domainInvalidCount} Flagged` : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "diagnostics" && (
            <StatisticalDiagnosticsView
              profile={profile}
              rows={fullRows}
              datasetName={dataset.name}
              onNavigateToCleaning={() => setActiveTab("cleaning")}
              onNavigateToPreview={() => setActiveTab("viewer")}
            />
          )}

          {activeTab === "cleaning" && (
            <DataCleaningStudio
              rows={fullRows}
              datasetName={dataset.name}
              onDatasetCleaned={(res) => {
                setFullRows(res.cleanedRows);
                setPreviewCols(res.columns);
                const computed = profileDataset(res.cleanedRows, dataset.name, { fileSize: dataset.size_bytes });
                setProfile(computed);
                setSortCol(null);
                setCurrentPage(1);
              }}
            />
          )}

          {activeTab === "visualizer" && (
            <InteractiveVisualizationStudio
              rows={fullRows}
              columns={previewCols}
              datasetName={dataset.name}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Export Pack Modal */}
      {isExportOpen && (
        <ExportPackModal
          rows={fullRows}
          columns={previewCols}
          datasetName={dataset.name}
          profile={profile}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </motion.div>
  );
}
