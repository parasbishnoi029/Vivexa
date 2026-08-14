import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Database, FolderKanban, MessageSquare, FileText, Loader2, Filter,
  Settings, Key, CreditCard, Shield, Users, Sparkles, Cpu, LineChart,
  TerminalSquare, Workflow, Blocks, ActivitySquare, BookOpen, Layers, Zap, ExternalLink,
  Lock, ShieldCheck, ShieldAlert
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { SearchIndexService, SearchHit, fuzzyMatch, maskSensitiveData } from "@/services/searchIndexService";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } }
};

const COMMAND_ACTIONS: SearchHit[] = [
  { title: "Invite Team Member", subtitle: "Grant workspace access to a new user", type: "Action", link: "/workspace/organization?openInvite=true", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { title: "Create New Project", subtitle: "Initialize a clean enterprise workspace", type: "Action", link: "/workspace/projects?newProject=true", icon: FolderKanban, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "Synthesize Strategy Report", subtitle: "Start AI executive briefing generation", type: "Action", link: "/workspace/reports?wizard=true", icon: Sparkles, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { title: "Generate API Key", subtitle: "Create a new bearer token for integrations", type: "Action", link: "/workspace/apikeys?generate=true", icon: Key, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { title: "Open Support Ticket", subtitle: "Connect with enterprise engineering team", type: "Action", link: "/workspace/settings?tab=support", icon: MessageSquare, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
];

const ALL_SYSTEM_FEATURES: SearchHit[] = [
  { title: "AI Analyst Studio", subtitle: "Decision intelligence & automated profiling", type: "Navigation", link: "/workspace/ai", icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "AI Interactive Chat", subtitle: "Conversational dataset queries & data scientist agent", type: "Navigation", link: "/workspace/ai/chat", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { title: "Predictive Models & ML", subtitle: "RandomForest, XGBoost & Churn prediction studio", type: "Navigation", link: "/workspace/predictions", icon: Cpu, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { title: "Time-Series Forecasting", subtitle: "ARIMA, Prophet & Neural Trajectory models", type: "Navigation", link: "/workspace/forecasting", icon: LineChart, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { title: "Executive Strategic Reports", subtitle: "Automated executive briefings & PDF generation", type: "Navigation", link: "/workspace/reports", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { title: "Data Cleaning & Imputation Studio", subtitle: "Null handling, outlier capping & anomaly repair", type: "Navigation", link: "/workspace/datasets", icon: Database, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "Billing & Usage Telemetry", subtitle: "Monthly API call quotas, usage meters & plan upgrades", type: "Settings", link: "/workspace/billing", icon: CreditCard, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { title: "API Keys & Developer Tokens", subtitle: "Manage bearer keys, authorization & Webhook secrets", type: "Settings", link: "/workspace/apikeys", icon: Key, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { title: "Security & Governance Policy", subtitle: "RBAC permissions, audit logs & encryption keys", type: "Settings", link: "/workspace/settings?tab=security", icon: Shield, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { title: "Organization & Team Members", subtitle: "Invite users, manage workspace roles & seats", type: "Settings", link: "/workspace/organization", icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "Data Connectors & Integrations", subtitle: "PostgreSQL, BigQuery, Snowflake & AWS S3 connections", type: "Ecosystem", link: "/workspace/connectors", icon: Layers, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { title: "Automations & Workflows", subtitle: "Triggered jobs, scheduled profiling & webhooks", type: "Ecosystem", link: "/workspace/automations", icon: Workflow, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { title: "Interactive Python Notebooks", subtitle: "Jupyter-like code execution & pandas analytics", type: "Ecosystem", link: "/workspace/notebooks", icon: TerminalSquare, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { title: "System Observability & Logs", subtitle: "Live API request latency, health metrics & errors", type: "Ecosystem", link: "/workspace/observability", icon: ActivitySquare, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { title: "Workspace Plugins & Add-ons", subtitle: "Extend capabilities with community algorithms", type: "Ecosystem", link: "/workspace/plugins", icon: Blocks, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { title: "Project Memory & Context", subtitle: "Long-term AI memory & domain rule storage", type: "Navigation", link: "/workspace/memory", icon: BookOpen, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" }
];

const DATASET_COLUMN_INDEX: SearchHit[] = [
  { title: "customer_id", subtitle: "Column in Customer Churn dataset (Categorical Unique ID)", type: "Column", link: "/workspace/datasets", icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "tenure", subtitle: "Column in Customer Churn dataset (Numeric - Account Length Months)", type: "Column", link: "/workspace/datasets", icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "monthly_charges", subtitle: "Column in Sales & Subscription dataset (Numeric - $ Recurring)", type: "Column", link: "/workspace/datasets", icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "total_charges", subtitle: "Column in Customer Lifetime Value dataset (Numeric)", type: "Column", link: "/workspace/datasets", icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "churn", subtitle: "Column / Target Label in Churn Prediction (Categorical Binary Yes/No)", type: "Column", link: "/workspace/predictions", icon: Layers, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { title: "revenue", subtitle: "Column in Q3 Financial Trajectory dataset (Numeric Sum)", type: "Column", link: "/workspace/forecasting", icon: Layers, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { title: "region", subtitle: "Column in Global Demographics dataset (Categorical Location)", type: "Column", link: "/workspace/datasets", icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { title: "payment_method", subtitle: "Column in Billing Transactions dataset (Credit Card, Bank Wire)", type: "Column", link: "/workspace/datasets", icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" }
];

import { toast } from "sonner";

export default function GlobalSearch() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // AI Assistant Search augmentation states
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSearchAnswer, setAiSearchAnswer] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<SearchHit | null>(null);

  useEffect(() => {
    const paramQ = searchParams.get("q");
    if (paramQ !== null && paramQ !== query) {
      setQuery(paramQ);
    }
  }, [searchParams]);

  const handleSelectHit = (hit: SearchHit) => {
    if (hit.action) {
      hit.action();
    }
    navigate(hit.link);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === "ArrowUp") {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
        handleSelectHit(filteredResults[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, results, categoryFilter]);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults(COMMAND_ACTIONS);
        setSelectedIndex(0);
        return;
      }
      setIsSearching(true);
      setSelectedIndex(0);
      try {
        const qLower = query.toLowerCase();

        // 1. Fetch Secured and Fuzzy-Matched Database Hits
        let dbHits: SearchHit[] = [];
        if (user) {
          dbHits = await SearchIndexService.searchAndSecure(query, user.id);
        }

        // Attach Icons properly to Database search hits
        const securedDbHits = dbHits.map(h => {
          let icon = Search;
          if (h.type === "Project") icon = FolderKanban;
          else if (h.type === "Dataset") icon = Database;
          else if (h.type === "Report") icon = FileText;
          else if (h.type === "AI Conversation") icon = MessageSquare;

          return { ...h, icon };
        });

        // 2. Perform secured fuzzy-matching on static system features & column indexes
        const localFeaturesScored = ALL_SYSTEM_FEATURES.map(item => {
          const titleMatch = fuzzyMatch(item.title, query);
          const subtitleMatch = item.subtitle ? fuzzyMatch(item.subtitle, query) : { matches: false, score: 0 };
          const matches = titleMatch.matches || subtitleMatch.matches;
          const score = Math.max(titleMatch.score, subtitleMatch.score * 0.8);
          return { item, matches, score };
        }).filter(x => x.matches);

        const localColumnsScored = DATASET_COLUMN_INDEX.map(item => {
          const titleMatch = fuzzyMatch(item.title, query);
          const subtitleMatch = item.subtitle ? fuzzyMatch(item.subtitle, query) : { matches: false, score: 0 };
          const matches = titleMatch.matches || subtitleMatch.matches;
          const score = Math.max(titleMatch.score, subtitleMatch.score * 0.8);
          return { item, matches, score };
        }).filter(x => x.matches);

        const localActionsScored = COMMAND_ACTIONS.map(item => {
          const titleMatch = fuzzyMatch(item.title, query);
          const subtitleMatch = item.subtitle ? fuzzyMatch(item.subtitle, query) : { matches: false, score: 0 };
          const matches = titleMatch.matches || subtitleMatch.matches;
          const score = Math.max(titleMatch.score, subtitleMatch.score * 0.8);
          return { item, matches, score };
        }).filter(x => x.matches);

        // Map scored items back to search hits
        const matchedLocalFeatures = localFeaturesScored.sort((a,b) => b.score - a.score).map(x => x.item);
        const matchedLocalColumns = localColumnsScored.sort((a,b) => b.score - a.score).map(x => x.item);
        const matchedLocalActions = localActionsScored.sort((a,b) => b.score - a.score).map(x => x.item);

        // Merge, de-duplicate and prioritize
        const combined = [
          ...matchedLocalActions,
          ...securedDbHits,
          ...matchedLocalFeatures,
          ...matchedLocalColumns
        ];

        const uniqueMap = new Map<string, SearchHit>();
        combined.forEach(hit => {
          const key = `${hit.type}:${hit.title.toLowerCase()}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, hit);
          }
        });

        setResults(Array.from(uniqueMap.values()));
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [query, user]);


  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSearchParams(val ? { q: val } : {});
  };

  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setAiSearchAnswer(null);
      setAiRecommendation(null);
      return;
    }
    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      let answer = "";
      let rec: SearchHit | null = null;
      if (q.includes("billing") || q.includes("quota") || q.includes("plan") || q.includes("subscription")) {
        answer = "To manage monthly consumption quotas or upgrade plans, use the Billing & Usage Telemetry center.";
        rec = ALL_SYSTEM_FEATURES.find(f => f.title.includes("Billing")) || null;
      } else if (q.includes("key") || q.includes("token") || q.includes("webhook") || q.includes("credential")) {
        answer = "Generate secure tokens, register custom webhooks or test active REST API routes inside the Developer Control Center.";
        rec = ALL_SYSTEM_FEATURES.find(f => f.title.includes("API")) || null;
      } else if (q.includes("member") || q.includes("team") || q.includes("organization") || q.includes("role") || q.includes("seat")) {
        answer = "Invite colleagues, assign RBAC permissions, and model seat growth in the Organization Directory.";
        rec = ALL_SYSTEM_FEATURES.find(f => f.title.includes("Organization")) || null;
      } else if (q.includes("dataset") || q.includes("column") || q.includes("clean") || q.includes("impute") || q.includes("tabular")) {
        answer = "Upload CSV/JSON assets, clean outliers, and run tabular imputation models inside the Imputation Studio.";
        rec = ALL_SYSTEM_FEATURES.find(f => f.title.includes("Cleaning")) || null;
      } else if (q.includes("predict") || q.includes("forecast") || q.includes("model") || q.includes("arima")) {
        answer = "Configure ARIMA forecasting models or train neural networks in the forecasting sandbox.";
        rec = ALL_SYSTEM_FEATURES.find(f => f.title.includes("Forecasting")) || null;
      } else if (q.includes("invite") || q.includes("add user")) {
        answer = "You can invite team members directly through the Organization actions command.";
        rec = COMMAND_ACTIONS.find(f => f.title.includes("Invite")) || null;
      }

      if (answer) {
        setAiSearchAnswer(answer);
        setAiRecommendation(rec);
      } else {
        setAiSearchAnswer(null);
        setAiRecommendation(null);
      }
      setIsAiThinking(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = useMemo(() => {
    return categoryFilter === "All"
      ? results
      : results.filter(r => {
          if (categoryFilter === "Actions") return r.type === "Action";
          if (categoryFilter === "Datasets & Columns") return r.type === "Dataset" || r.type === "Column";
          if (categoryFilter === "Models & Forecasts") return r.type === "Project" || r.title.toLowerCase().includes("predict") || r.title.toLowerCase().includes("forecast");
          if (categoryFilter === "Reports") return r.type === "Report";
          if (categoryFilter === "AI Chat") return r.type === "AI Conversation";
          if (categoryFilter === "Navigation & Settings") return r.type === "Navigation" || r.type === "Settings" || r.type === "Ecosystem";
          return true;
        });
  }, [results, categoryFilter]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-full flex flex-col items-center pt-8 relative z-10 w-full max-w-4xl mx-auto px-4 pb-12">
      <motion.div variants={itemVariants} className="w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Zap className="h-3.5 w-3.5" /> Universal Intelligence Index
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Universal Command Center</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">Instant access to enterprise assets, automated actions, and predictive analytics modules.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full relative group">
        <div className="absolute inset-0 bg-indigo-500/15 blur-2xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <Card className="relative bg-slate-900/90 border-slate-700/60 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-2xl">
          <div className="flex items-center px-6 py-4 border-b border-slate-800/80">
            <Search className="h-6 w-6 text-indigo-400 mr-4 shrink-0" />
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search assets or type a command like 'Invite User'..." 
              className="w-full bg-transparent border-none text-base sm:text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
            />
            {isSearching && <Loader2 className="h-5 w-5 text-indigo-400 animate-spin mr-2 shrink-0" />}
            {query && (
              <button onClick={() => handleQueryChange("")} className="text-xs text-slate-400 hover:text-white mr-2">Clear</button>
            )}
            <div className="text-xs font-mono text-slate-500 px-2 py-1 rounded bg-slate-800 ml-1 shrink-0 border border-slate-700 hidden sm:block">⌘K</div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto text-xs text-slate-400 scrollbar-hide">
            <Filter className="h-3.5 w-3.5 text-slate-500 mr-1 shrink-0" />
            {["All", "Actions", "Datasets & Columns", "Models & Forecasts", "AI Chat", "Reports", "Navigation & Settings"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {/* AI Assistant Insight Section */}
            {isAiThinking && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-indigo-500/10 flex items-center gap-3 animate-pulse">
                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                <span className="text-xs text-indigo-300 font-medium font-mono">AI Search Assistant is analyzing workspace telemetry...</span>
              </div>
            )}

            {!isAiThinking && aiSearchAnswer && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/25 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">✨ AI Search Assistant Insight</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {aiSearchAnswer}
                </p>
                {aiRecommendation && (
                  <div 
                    onClick={() => handleSelectHit(aiRecommendation)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-indigo-500/20 cursor-pointer group/rec transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400`}>
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-200 group-hover/rec:text-indigo-300 transition-colors block">
                          Deep-Link: Navigate to {aiRecommendation.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Jump directly to this module</span>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover/rec:text-indigo-400 transition-colors" />
                  </div>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {query.trim().length > 0 && filteredResults.length === 0 && !isSearching ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-slate-500 space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No matching assets or settings found for "{query}"</p>
                  <p className="text-xs text-slate-500">Try searching for "dataset", "churn", "revenue", "billing", "api keys", or "forecasting"</p>
                </motion.div>
              ) : (query.trim().length > 0 || categoryFilter !== "All") ? (
                filteredResults.map((result, idx) => {
                  const ResultIcon = result.icon || Search;
                  const isSelected = idx === selectedIndex;
                  return (
                    <motion.div 
                      key={`${result.type}-${result.title}-${idx}`} 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectHit(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${
                        isSelected ? "bg-slate-800/80 border-indigo-500/60 shadow-lg" : "bg-transparent border-transparent"
                      }`}
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${result.bg}`}>
                        <ResultIcon className={`h-5 w-5 ${result.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold transition-colors truncate ${isSelected ? "text-indigo-300" : "text-slate-200"}`}>{result.title}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wider shrink-0 ${
                              isSelected ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-slate-800 text-slate-400 border-slate-700/60"
                            }`}>
                              {result.type}
                            </span>
                          </div>

                          {/* Security Classification Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {result.securityClassification === "CONFIDENTIAL" && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border bg-rose-500/10 border-rose-500/20 text-rose-400 flex items-center gap-0.5 shadow-sm">
                                <Lock className="h-2.5 w-2.5" /> Confidential
                              </span>
                            )}
                            {result.securityClassification === "SENSITIVE_PII" && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-400 flex items-center gap-0.5 shadow-sm">
                                <ShieldAlert className="h-2.5 w-2.5" /> Sensitive PII
                              </span>
                            )}
                            {result.securityClassification === "PUBLIC" && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-0.5 shadow-sm">
                                <ShieldCheck className="h-2.5 w-2.5" /> Public Asset
                              </span>
                            )}
                            {result.isMasked && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-sky-500/10 border-sky-500/20 text-sky-400 flex items-center gap-0.5 shadow-sm" title="Sensitive elements automatically masked by Data Shield">
                                Masked
                              </span>
                            )}
                          </div>
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1.5">
                            {result.subtitle}
                          </div>
                        )}
                        {result.securityWarning && (
                          <div className="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3 shrink-0" /> {result.securityWarning}
                          </div>
                        )}
                      </div>
                      <div className={`text-xs font-medium shrink-0 flex items-center gap-1 transition-opacity ${isSelected ? "opacity-100 text-indigo-400" : "opacity-0 text-slate-500"}`}>
                        Execute &rarr;
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Popular Quick Commands</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
                    {COMMAND_ACTIONS.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectHit(item)}
                          className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/50 transition-all flex items-center gap-3 group"
                        >
                          <div className={`p-2 rounded-lg border ${item.bg}`}>
                            <Icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">{item.title}</div>
                            <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
