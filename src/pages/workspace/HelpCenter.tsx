import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, BookOpen, Sparkles, Database, FolderKanban, Bot, FileText,
  Key, Users, ShieldCheck, ChevronRight, HelpCircle, ArrowUpRight,
  CheckCircle2, Code2, Download, Lightbulb, Terminal, Layers, Play,
  Video, MessageSquare, AlertTriangle, Shield, Activity, Cpu, RefreshCw,
  Clock, ThumbsUp, ThumbsDown, Star, Send, Filter, Check, Copy, ExternalLink,
  Laptop, Server, Workflow, Zap, Compass, Flame, HelpCircle as QuestionIcon,
  LifeBuoy, Mail, Phone, Calendar, Globe, Bookmark, FileSpreadsheet, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { PriorityTicketModal, PriorityTicket } from "@/components/workspace/PriorityTicketModal";

// CATEGORIES FOR HELP CENTER
const HELP_SECTIONS = [
  { id: "overview", label: "Help Center Home", icon: LifeBuoy },
  { id: "system_architecture", label: "System Architecture & Diagrams", icon: Layers },
  { id: "quickstart", label: "Interactive Quick Start", icon: Sparkles },
  { id: "product_tour", label: "Product Tour", icon: Compass },
  { id: "user_manual", label: "User Manual & Docs", icon: BookOpen },
  { id: "admin_guide", label: "Administrator Guide", icon: ShieldCheck },
  { id: "dev_guide", label: "Developer Guide & SDK", icon: Code2 },
  { id: "api_docs", label: "API Documentation Explorer", icon: Terminal },
  { id: "notebook_guide", label: "Notebook & Kernel Guide", icon: FileText },
  { id: "ai_learning", label: "AI Learning & Prompt Engineering", icon: Bot },
  { id: "tutorials", label: "Video Tutorials", icon: Video },
  { id: "faq", label: "Frequently Asked Questions (FAQ)", icon: QuestionIcon },
  { id: "troubleshooting", label: "Troubleshooting & Error Matrix", icon: AlertTriangle },
  { id: "release_notes", label: "Release Notes & Changelog", icon: Flame },
  { id: "roadmap", label: "Product Roadmap & Voting", icon: Workflow },
  { id: "community", label: "Community & Templates", icon: Users },
  { id: "support", label: "Enterprise Support & Live Chat", icon: Mail },
  { id: "system_status", label: "System Status & Infrastructure", icon: Activity },
];

export default function HelpCenter() {
  const [activeSection, setActiveSection] = useState("overview");
  const [activeDiagramTab, setActiveDiagramTab] = useState("topology");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Priority Support Ticket Modal State
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");

  // Priority Tickets State loaded from localStorage or seeded
  const [tickets, setTickets] = useState<PriorityTicket[]>(() => {
    try {
      const raw = localStorage.getItem("vivexa_priority_tickets");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "TICK-2026-1042",
        subject: "SCIM 2.0 User Sync & Role Assignment Verification",
        category: "SCIM 2.0 / Okta Sync Failure",
        severity: "P1",
        description: "Verify automated user provisioning and Okta SAML role sync for enterprise workspace.",
        email: "info.vivexa@gmail.com",
        status: "INVESTIGATING",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        slaMinutes: 15,
        assignedEngineer: "Alex Vance (Principal Systems SRE)",
        telemetryAttached: true,
        replies: [
          {
            id: "r1",
            sender: "Vivexa Automated Triage Agent",
            role: "AI SRE Bot",
            message: "SCIM RFC 7644 token validated. Synchronizing user role mapping tables across cloud regions.",
            timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString()
          },
          {
            id: "r2",
            sender: "Alex Vance",
            role: "Principal Systems SRE",
            message: "I am actively monitoring the SCIM endpoint logs. Authorization headers and group claims look healthy.",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
          }
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("vivexa_priority_tickets", JSON.stringify(tickets));
    } catch (e) {
      console.error(e);
    }
  }, [tickets]);

  useEffect(() => {
    const handleTicketEvent = (e: CustomEvent<PriorityTicket>) => {
      if (e.detail) {
        setTickets((prev) => [e.detail, ...prev.filter(t => t.id !== e.detail.id)]);
        setActiveSection("support");
      }
    };
    window.addEventListener("vivexa_ticket_created", handleTicketEvent as EventListener);
    return () => {
      window.removeEventListener("vivexa_ticket_created", handleTicketEvent as EventListener);
    };
  }, []);

  const handleTicketCreated = (newTicket: PriorityTicket) => {
    setTickets((prev) => [newTicket, ...prev.filter(t => t.id !== newTicket.id)]);
    setActiveSection("support");
  };

  const handleAddReply = (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            replies: [
              ...t.replies,
              {
                id: `rep-${Date.now()}`,
                sender: "Client User (You)",
                role: "Customer Admin",
                message: ticketReplyText.trim(),
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return t;
      })
    );
    setTicketReplyText("");
    toast.success("Reply added to priority ticket.");
  };

  // Quick Start Progress
  const [quickStartProgress, setQuickStartProgress] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false,
    step6: false
  });

  // Ask AI Assistant state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // FAQ Accordion State
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  // API Explorer state
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiEndpoint, setApiEndpoint] = useState("/api/v1/datasets");
  const [apiLanguage, setApiLanguage] = useState("python");

  // Roadmap voting state
  const [votedItems, setVotedItems] = useState<Record<string, number>>({
    "item-1": 142,
    "item-2": 98,
    "item-3": 215,
    "item-4": 76
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleAiAsk = () => {
    if (!aiQuestion.trim()) return;
    setIsAiSearching(true);
    setAiAnswer(null);

    setTimeout(() => {
      const q = aiQuestion.toLowerCase();
      let answer = "";
      if (q.includes("model") || q.includes("train") || q.includes("predict")) {
        answer = "To train a machine learning model in Vivexa:\n1. Navigate to 'Predictions & ML' in the workspace sidebar.\n2. Select an uploaded dataset.\n3. Choose your target column (classification or regression).\n4. Click 'Train Predictive Model'. Vivexa automatically evaluates Random Forest, Gradient Boosting, and XGBoost models, presenting feature importances and ROC-AUC scores.";
      } else if (q.includes("clean") || q.includes("missing") || q.includes("null")) {
        answer = "Data cleaning is automated in Vivexa:\n1. Go to 'Datasets' and select your target dataset.\n2. Click 'Data Quality Assessment' or 'Clean Dataset'.\n3. Vivexa detects missing values, duplicate rows, outlier distributions, and skewness.\n4. Apply 1-click imputations (Mean, Median, KNN, or Forward Fill).";
      } else if (q.includes("notebook") || q.includes("python") || q.includes("sql")) {
        answer = "Vivexa Notebooks support multi-kernel execution:\n1. Go to 'Notebooks' in the sidebar.\n2. Create a new notebook with Python 3.11, SQL, or Markdown cells.\n3. Use 'import vivexa as vx' to query workspace datasets directly into Pandas DataFrames.\n4. Ask Vivexa AI inside the notebook to generate visualization code or SQL queries.";
      } else {
        answer = `Regarding "${aiQuestion}":\nVivexa Enterprise handles this through its integrated AI Intelligence engine and workspace services. You can manage workspace settings, invite team members, query datasets via natural language, or automate workflows using our REST API or Python SDK. Refer to the User Manual or API Docs sections in this Help Center for detailed step-by-step instructions.`;
      }
      setAiAnswer(answer);
      setIsAiSearching(false);
    }, 800);
  };

  const toggleVote = (id: string) => {
    setVotedItems(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    toast.success("Thank you for voting on this roadmap item!");
  };

  return (
    <div className="space-y-6 relative z-10 w-full max-w-7xl mx-auto pb-16 text-slate-100 font-sans">
      {/* HERO HEADER & SEARCH BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-8 rounded-3xl border border-indigo-500/20 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <LifeBuoy className="h-3.5 w-3.5" /> Vivexa Enterprise Knowledge Base V2.0
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            How can we assist your enterprise analytics team today?
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Explore 200+ pages of official documentation, interactive API explorers, video walkthroughs, ML guides, and troubleshooting matrixes.
          </p>

          {/* Global Documentation Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, API endpoints, error codes, Python SDK, SQL examples..."
                className="pl-10 bg-slate-950/90 border-slate-700/80 text-sm text-white placeholder:text-slate-500 h-11 rounded-xl focus-visible:ring-indigo-500 shadow-inner"
              />
            </div>
            <Button
              onClick={() => setActiveSection("user_manual")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11 px-5 rounded-xl shadow-lg shrink-0"
            >
              Browse Docs
            </Button>
            <Button
              onClick={() => setIsPriorityModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-11 px-5 rounded-xl shadow-lg shrink-0 flex items-center gap-2 border border-rose-400/30"
            >
              <AlertTriangle className="h-4 w-4" /> Open Priority Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN HELP CENTER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT NAVIGATION SIDEBAR */}
        <div className="lg:col-span-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-xl h-fit space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
            Knowledge Modules
          </div>
          {HELP_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT MAIN CONTENT DISPLAY */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-2xl p-6 min-h-[650px]">
            {/* 1. HELP CENTER OVERVIEW / HOME */}
            {activeSection === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-indigo-400" /> Enterprise Knowledge & Support Hub
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a section or explore popular getting-started topics below.
                  </p>
                </div>

                {/* Smart AI Documentation Assistant Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Bot className="h-4 w-4 text-indigo-400" /> Ask Vivexa AI Documentation Assistant
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                      placeholder="e.g. How do I train a prediction model on uploaded CSV data?"
                      className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-500"
                    />
                    <Button onClick={handleAiAsk} disabled={isAiSearching} className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 text-xs">
                      {isAiSearching ? "Searching Docs..." : "Ask AI"}
                    </Button>
                  </div>

                  {aiAnswer && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Answer from Vivexa Docs:
                      </div>
                      {aiAnswer}
                    </motion.div>
                  )}
                </div>

                {/* Quick Link Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setActiveSection("quickstart")}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Quick Start Onboarding</h3>
                    <p className="text-xs text-slate-400 mt-1">Interactive 6-step walkthrough for new workspace members.</p>
                  </div>

                  <div
                    onClick={() => setActiveSection("api_docs")}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                      <Terminal className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Interactive API Explorer</h3>
                    <p className="text-xs text-slate-400 mt-1">REST API endpoints, SDK code snippets, and webhooks.</p>
                  </div>

                  <div
                    onClick={() => setActiveSection("troubleshooting")}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Troubleshooting & Fixes</h3>
                    <p className="text-xs text-slate-400 mt-1">Resolutions for upload errors, SQL issues, and notebooks.</p>
                  </div>
                </div>

                {/* Popular FAQ Teaser */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Popular Knowledge Articles</h3>
                  <div className="space-y-2">
                    {[
                      "How to import large multi-gigabyte CSV or Parquet files into Vivexa workspace?",
                      "How does Vivexa AI calculate statistical confidence scores for churn predictions?",
                      "Configuring OAuth integrations for Google Drive, Slack, and Snowflake data pipelines.",
                      "Setting up automated scheduled daily email executive reports."
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveSection("faq")}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:bg-slate-900 text-xs text-slate-300 cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-indigo-400" /> {item}</span>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 1.5. SYSTEM ARCHITECTURE & DIAGRAMS */}
            {activeSection === "system_architecture" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-400" /> Platform Architecture & System Flows
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Visual schematics representing network layouts, entity relationships, cryptographic token gateways, and deployment patterns.
                  </p>
                </div>

                {/* Sub-tabs for different diagrams */}
                <div className="flex flex-wrap gap-2 p-1 bg-slate-950 border border-slate-800/80 rounded-xl">
                  {[
                    { id: "topology", label: "Network Topology", icon: Globe },
                    { id: "schema", label: "Database Schema (ERD)", icon: Database },
                    { id: "request_flow", label: "API Sequence Flow", icon: Workflow },
                    { id: "auth", label: "JWT & Security Guard", icon: ShieldCheck },
                    { id: "deployment", label: "Container Hosting", icon: Server },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeDiagramTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDiagramTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                  {/* 1. Network Topology View */}
                  {activeDiagramTab === "topology" && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 max-w-sm">
                          <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Layer 1-3 Infrastructure</span>
                          <h3 className="text-sm font-bold text-white">Full-Stack Decoupled Architecture</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Vivexa segregates the user experience from the data analysis workloads. Nginx acts as a high-speed reverse proxy routing client requests directly to static assets or Node.js Express controllers.
                          </p>
                        </div>
                        
                        <div className="flex-1 w-full flex flex-col items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
                          {/* Visual CSS-based flowchart with high contrast colors */}
                          <div className="w-full max-w-md space-y-3">
                            <div className="flex flex-col items-center p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-center">
                              <span className="font-extrabold text-white text-xs flex items-center gap-1.5"><Laptop className="h-3.5 w-3.5 text-indigo-400" /> Client browser</span>
                              <span className="text-[10px] text-slate-400">React 19 + Tailwind SPA</span>
                            </div>
                            
                            <div className="flex justify-center h-4"><div className="w-0.5 bg-indigo-500/30 h-full border-dashed border-l"></div></div>

                            <div className="flex flex-col items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center relative">
                              <span className="font-extrabold text-white text-xs flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Ingress / Nginx Reverse Proxy</span>
                              <span className="text-[10px] text-slate-400">SSL offloading + Static assets server</span>
                            </div>

                            <div className="flex justify-center h-4"><div className="w-0.5 bg-indigo-500/30 h-full border-dashed border-l"></div></div>

                            <div className="flex flex-col items-center p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-center">
                              <span className="font-extrabold text-white text-xs flex items-center gap-1.5"><Server className="h-3.5 w-3.5 text-indigo-400" /> Express Node.js API Server</span>
                              <span className="text-[10px] text-slate-400">REST Controllers & Middlewares</span>
                            </div>

                            <div className="flex justify-center h-4"><div className="w-0.5 bg-indigo-500/30 h-full border-dashed border-l"></div></div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                <span className="font-bold text-white text-[10px] block"><Bot className="h-3.5 w-3.5 text-purple-400 mx-auto mb-1" /> Gemini API</span>
                                <span className="text-[9px] text-slate-500">Domain Models</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                <span className="font-bold text-white text-[10px] block"><ShieldCheck className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" /> Supabase</span>
                                <span className="text-[9px] text-slate-500">JWT Sessions</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                <span className="font-bold text-white text-[10px] block"><Database className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" /> Postgres DB</span>
                                <span className="text-[9px] text-slate-500">Drizzle ORM</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Database Schema (ERD) View */}
                  {activeDiagramTab === "schema" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Relational Schema & Entity Relationships</span>
                        <h3 className="text-sm font-bold text-white">PostgreSQL Declarative Schemas</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We use a strictly typed database layout managed with Drizzle ORM. Row-level integrity checks ensure user separation across workspaces.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 relative">
                          <span className="absolute top-3 right-3 text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">1:N users</span>
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-indigo-400" /> users</h4>
                          <div className="space-y-1 text-[10px] font-mono text-slate-400">
                            <div className="text-slate-200"><span className="text-indigo-400">id</span> : uuid (PK)</div>
                            <div>email : varchar(255)</div>
                            <div>role : varchar(50)</div>
                            <div>created_at : timestamp</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 relative">
                          <span className="absolute top-3 right-3 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">N:1 user_id</span>
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5"><FolderKanban className="h-3.5 w-3.5 text-emerald-400" /> projects</h4>
                          <div className="space-y-1 text-[10px] font-mono text-slate-400">
                            <div className="text-slate-200"><span className="text-emerald-400">id</span> : uuid (PK)</div>
                            <div className="text-indigo-400">user_id : uuid (FK)</div>
                            <div>name : varchar(100)</div>
                            <div>description : text</div>
                            <div>created_at : timestamp</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 relative">
                          <span className="absolute top-3 right-3 text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold">N:1 user_id</span>
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-cyan-400" /> api_keys</h4>
                          <div className="space-y-1 text-[10px] font-mono text-slate-400">
                            <div className="text-slate-200"><span className="text-cyan-400">id</span> : uuid (PK)</div>
                            <div className="text-indigo-400">user_id : uuid (FK)</div>
                            <div>key_prefix : varchar(12)</div>
                            <div>scopes : text[]</div>
                            <div>expires_at : timestamp</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 relative">
                          <span className="absolute top-3 right-3 text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono font-bold">N:1 project_id</span>
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-purple-400" /> datasets</h4>
                          <div className="space-y-1 text-[10px] font-mono text-slate-400">
                            <div className="text-slate-200"><span className="text-purple-400">id</span> : uuid (PK)</div>
                            <div className="text-emerald-400">project_id : uuid (FK)</div>
                            <div>filename : varchar(255)</div>
                            <div>file_size : bigint</div>
                            <div>record_count : integer</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 relative">
                          <span className="absolute top-3 right-3 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">N:1 user_id</span>
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-amber-400" /> audit_logs</h4>
                          <div className="space-y-1 text-[10px] font-mono text-slate-400">
                            <div className="text-slate-200"><span className="text-amber-400">id</span> : uuid (PK)</div>
                            <div className="text-indigo-400">user_id : uuid (FK)</div>
                            <div>action : varchar(100)</div>
                            <div>resource : varchar(100)</div>
                            <div>timestamp : timestamp</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. API Request Sequence View */}
                  {activeDiagramTab === "request_flow" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">REST Request Lifecycle Timeline</span>
                        <h3 className="text-sm font-bold text-white">End-to-End API Execution Pathway</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Tracing the execution cascade when a client triggers an intelligence advisory report through the backend framework:
                        </p>
                      </div>

                      <div className="space-y-3 font-mono text-[11px] text-slate-300">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase shrink-0">Step 1</span>
                          <div>
                            <span className="font-bold text-white block">Client Dispatch</span>
                            <span>Client initiates `POST /api/v1/analyze` passing dataset references and the secure bearer JWT header.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase shrink-0">Step 2</span>
                          <div>
                            <span className="font-bold text-white block">Token Signature Cryptographic Verify</span>
                            <span>Express routing middleware extracts JWT and validates signature with the Supabase Cryptographic Session validation module.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase shrink-0">Step 3</span>
                          <div>
                            <span className="font-bold text-white block">Gemini AI Model Inference</span>
                            <span>Controller loads the dataset's schema context and fires an optimized multi-step structured query to the Gemini SDK.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase shrink-0">Step 4</span>
                          <div>
                            <span className="font-bold text-white block">Immutable Event Audit Logging</span>
                            <span>The API logging system records an audit entry inside the `audit_logs` database table before packaging results.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase shrink-0">Step 5</span>
                          <div>
                            <span className="font-bold text-white block">Secure JSON Delivery</span>
                            <span>API server responds with compiled analytics payload, automatically closing the client loading state with a smooth enter transition.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. JWT & Security Guard View */}
                  {activeDiagramTab === "auth" && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 max-w-sm">
                          <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Authentication & Role-Based Security</span>
                          <h3 className="text-sm font-bold text-white">Cryptographic Sessions & Guard Sandboxes</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Vivexa provides multi-tier user isolation. Every endpoint query checks user roles from PostgreSQL before matching routes, preventing horizontal privilege escalation.
                          </p>
                        </div>

                        <div className="flex-1 w-full p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-3 text-xs">
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1.5">
                            <span className="font-bold text-indigo-400 block text-[10px] uppercase">Cryptographic Key Guard Verification</span>
                            <p className="text-[11px] text-slate-300">
                              Developer API Keys are verified at execution runtime. Keys must use custom prefixes to bypass local filters:
                            </p>
                            <div className="flex flex-col gap-1 pt-1">
                              <span className="text-[10px] font-mono p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">vvx_live_*** (Valid Live Production API Key)</span>
                              <span className="text-[10px] font-mono p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">vvx_test_*** (Local Cryptographic Test Sandbox)</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1">
                            <span className="font-bold text-emerald-400 block text-[10px] uppercase">Role Authorization Matrix</span>
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center pt-1 text-slate-400">
                              <div className="p-1 rounded bg-slate-900 border border-slate-800"><span className="text-emerald-400">Admin</span><br/>Full Access</div>
                              <div className="p-1 rounded bg-slate-900 border border-slate-800"><span className="text-indigo-400">User</span><br/>Workspace</div>
                              <div className="p-1 rounded bg-slate-900 border border-slate-800"><span className="text-slate-500">Viewer</span><br/>Read-Only</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Container Cloud Deployment View */}
                  {activeDiagramTab === "deployment" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Orchestrated Deployment Architecture</span>
                        <h3 className="text-sm font-bold text-white">Dockerized Virtual Machine Hosting</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Vivexa is designed to run everywhere. The package outputs a multi-stage Dockerized build containing Nginx static reverse proxies and compiled CommonJS servers.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                          <span className="font-bold text-white block">CI/CD Automated Integration Pipeline</span>
                          <p className="text-slate-400">
                            Our GitHub Actions runner automatically executes compilation tests, static type checks, and linter runs on every main repository pull-request branch before triggering deployments.
                          </p>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">ci.yml (Github Action File Active)</span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                          <span className="font-bold text-white block">Docker Container Architecture</span>
                          <p className="text-slate-400">
                            A highly optimized, multi-stage alpine base image containing Node.js environment layers that binds process queries to internal port `3000`.
                          </p>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Dockerfile & docker-compose.yml Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. INTERACTIVE QUICK START */}
            {activeSection === "quickstart" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" /> Interactive Quick Start Onboarding Guide
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Follow these 6 steps to configure your enterprise workspace and run your first AI analysis.</p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-300">Onboarding Completion Progress</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Estimated time: 5-8 minutes total</p>
                  </div>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {Math.round((Object.values(quickStartProgress).filter(Boolean).length / 6) * 100)}% Complete
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "step1", title: "1. Account & Workspace Setup", desc: "Create your personal or team workspace, select your primary cloud region, and customize workspace permissions." },
                    { id: "step2", title: "2. Upload Target Dataset", desc: "Navigate to Datasets > Upload. Drag and drop CSV, Parquet, or Excel files. Vivexa profiles column data types and null counts automatically." },
                    { id: "step3", title: "3. Run AI Exploratory Data Analysis", desc: "Open AI Analyst or AI Chat. Ask natural language questions like 'What are top drivers of churn?' to receive instant executive charts and statistical briefs." },
                    { id: "step4", title: "4. Build Predictive & Time-Series Forecasts", desc: "Use the Predictions or Forecasting tab to fit machine learning models (XGBoost, ARIMA, Prophet) and view expected revenue trajectories." },
                    { id: "step5", title: "5. Generate Executive PowerPoint / PDF Reports", desc: "Navigate to Executive Reports to automatically format findings into executive briefs for board presentations." },
                    { id: "step6", title: "6. Invite Team Members & Configure API Keys", desc: "Go to Settings > Organization to invite analysts, data scientists, or admins with granular role-based access control (RBAC)." }
                  ].map((step) => {
                    const isDone = quickStartProgress[step.id];
                    return (
                      <div key={step.id} className={`p-4 rounded-2xl border text-xs transition-all ${isDone ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-900/60 border-slate-800'}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className={`font-bold text-sm ${isDone ? 'text-slate-300 line-through' : 'text-white'}`}>{step.title}</h3>
                            <p className="text-slate-400 text-xs">{step.desc}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={isDone ? "outline" : "default"}
                            onClick={() => setQuickStartProgress(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                            className={`h-8 text-xs ${isDone ? 'border-emerald-500/40 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                          >
                            {isDone ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : null}
                            {isDone ? "Completed" : "Mark Complete"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. PRODUCT TOUR */}
            {activeSection === "product_tour" && (
              <ProductConvergenceTour />
            )}

            {/* 4. USER MANUAL */}
            {activeSection === "user_manual" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-400" /> Official Vivexa User Manual
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Deep documentation covering workspace operations, dataset profiling, and AI agents.</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="font-bold text-slate-200 text-sm">Chapter 1: Datasets & Schema Engineering</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Vivexa ingests CSV, Excel, and JSON files up to 500MB per dataset. When a file is uploaded, the data engine parses raw records, identifies numerical vs categorical dimensions, and calculates descriptive statistics (mean, std, min, 25%, 50%, 75%, max). Missing values are flagged with exact missingness percentages.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="font-bold text-slate-200 text-sm">Chapter 2: Machine Learning & Predictive Modeling</h3>
                    <p className="text-slate-400 leading-relaxed">
                      The ML pipeline automates feature encoding, train-test splitting (80/20 ratio), and model selection. Gradient Boosting (XGBoost) and Random Forest classifiers are trained in parallel, returning ROC-AUC curves, precision-recall metrics, and Gini feature importances.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="font-bold text-slate-200 text-sm">Chapter 3: Executive Reporting & Export</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Executive reports transform raw analytical outputs into structured executive summaries containing key statistical evidence, recommended actions, ROI projections, and risk assessments. Reports can be exported directly to Markdown, PDF, or HTML.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ADMIN GUIDE */}
            {activeSection === "admin_guide" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" /> Administrator & Security Guide
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Managing enterprise governance, SSO, audit trails, and role-based access control.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h3 className="font-bold text-white mb-1">Role-Based Access Control (RBAC)</h3>
                    <p className="text-slate-400">
                      Vivexa supports 4 default roles: <strong>Workspace Owner</strong>, <strong>Admin</strong>, <strong>Data Scientist</strong>, and <strong>Viewer</strong>. Admins can restrict dataset deletion and API key creation per role.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <h3 className="font-bold text-white mb-1">Audit Trails & Security Compliance</h3>
                    <p className="text-slate-400">
                      All login attempts, API key generation, profile updates, and dataset exports are recorded in the searchable Audit History log with timestamp, IP address, and user ID.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. DEVELOPER GUIDE */}
            {activeSection === "dev_guide" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-indigo-400" /> Developer Guide & Python SDK
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Integrate Vivexa directly into your data pipelines using Python or REST.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span>Python SDK Quick Start (`pip install vivexa`)</span>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy("import vivexa as vx\nclient = vx.Client(api_key='vx_secret_key')\ndf = client.datasets.get('ds-14500').to_pandas()", "py-sdk")} className="h-6 text-[10px]">
                      <Copy className="h-3 w-3 mr-1" /> Copy Code
                    </Button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
{`import vivexa as vx

# Initialize client
client = vx.Client(api_key="vx_secret_key")

# Query dataset into Pandas DataFrame
df = client.datasets.get("ds-14500").to_pandas()

# Run AI churn propensity model
model = client.ml.train_classifier(
    dataset_id="ds-14500",
    target_column="churned"
)

print("ROC-AUC Score:", model.roc_auc)`}
                  </pre>
                </div>
              </div>
            )}

            {/* 7. API DOCUMENTATION EXPLORER */}
            {activeSection === "api_docs" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-emerald-400" /> Interactive API Documentation Explorer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Test REST API endpoints and generate cURL, Python, or JavaScript request blocks.</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {["GET", "POST", "DELETE"].map(m => (
                    <button
                      key={m}
                      onClick={() => setApiMethod(m)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        apiMethod === m ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <select
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="/api/v1/datasets">/api/v1/datasets (List Datasets)</option>
                    <option value="/api/v1/gemini/chat">/api/v1/gemini/chat (Ask AI)</option>
                    <option value="/api/v1/predictions">/api/v1/predictions (Train Model)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span>{apiMethod} {apiEndpoint} Request</span>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(`curl -X ${apiMethod} "https://app.vivexa.ai${apiEndpoint}" -H "Authorization: Bearer vx_secret_key"`, "curl")} className="h-6 text-[10px]">
                      <Copy className="h-3 w-3 mr-1" /> Copy cURL
                    </Button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-blue-300 font-mono text-xs overflow-x-auto">
{`curl -X ${apiMethod} "https://app.vivexa.ai${apiEndpoint}" \\
  -H "Authorization: Bearer vx_secret_key" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>
            )}

            {/* 8. FAQ */}
            {activeSection === "faq" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <QuestionIcon className="h-5 w-5 text-indigo-400" /> Frequently Asked Questions (FAQ)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">100+ answered questions covering uploads, security, pricing, and AI engine mechanics.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "faq-1", q: "What file formats and dataset sizes are supported?", a: "Vivexa natively supports CSV, Excel (.xlsx, .xls), JSON, and Apache Parquet (.parquet) files up to 500MB per dataset file on the Pro tier." },
                    { id: "faq-2", q: "How is user data privacy and security handled?", a: "All data is encrypted in transit via TLS 1.3 and at rest via AES-256. Vivexa does not use user datasets to train public AI models." },
                    { id: "faq-3", q: "How do I generate and export executive reports?", a: "Navigate to 'Executive Reports' in the workspace sidebar. Select your target project or dataset, and click 'Generate Executive Brief'. You can export to Markdown or PDF." },
                    { id: "faq-4", q: "Can I connect live external SQL databases?", a: "Yes. Use the 'Data Connectors' tab to connect live PostgreSQL, Snowflake, BigQuery, or Amazon Redshift databases." }
                  ].map((faq) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div key={faq.id} className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                        <button
                          onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                          className="w-full p-4 text-left font-bold text-white flex items-center justify-between hover:bg-slate-900/60"
                        >
                          <span>{faq.q}</span>
                          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="p-4 pt-0 text-slate-300 leading-relaxed border-t border-slate-800/80 mt-1">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 9. TROUBLESHOOTING */}
            {activeSection === "troubleshooting" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" /> Troubleshooting & Error Resolution Matrix
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Common operational errors, diagnostic root causes, and resolutions.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { error: "Dataset Upload Failed (500)", cause: "Corrupted header line or unescaped comma inside string columns.", fix: "Inspect raw CSV line 1 with a text editor to ensure column names match standard alphanumeric format without leading spaces." },
                    { error: "Permission Denied on Project Memory", cause: "User account role set to 'Viewer' instead of 'Data Scientist' or 'Admin'.", fix: "Contact your Workspace Owner to update your role in Settings > Organization." },
                    { error: "Notebook Execution Timeout", cause: "Infinite loop or memory limit exceeding 4GB during matrix multiplication.", fix: "Optimize DataFrame operations using Vectorized Numpy functions instead of Python for-loops." }
                  ].map((err, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="font-bold text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> {err.error}
                      </div>
                      <p className="text-slate-300"><span className="text-slate-400 font-semibold">Root Cause:</span> {err.cause}</p>
                      <p className="text-emerald-400"><span className="text-slate-400 font-semibold">Resolution:</span> {err.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. ROADMAP & VOTING */}
            {activeSection === "roadmap" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-indigo-400" /> Product Roadmap & Community Feature Voting
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Vote on upcoming Vivexa features and track development status.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "item-1", title: "Real-time Multi-User Collaborative Notebook Canvas", status: "Under Development", eta: "Q4 2026" },
                    { id: "item-2", title: "Native Databricks Delta Lake Connector", status: "Planned", eta: "Q1 2026" },
                    { id: "item-3", title: "Automated Executive PowerPoint (.pptx) Slide Generator", status: "In Testing", eta: "Next Release" }
                  ].map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-slate-400 mt-1">Status: <span className="text-indigo-400 font-semibold">{item.status}</span> • Target: {item.eta}</div>
                      </div>
                      <Button onClick={() => toggleVote(item.id)} size="sm" variant="outline" className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 text-xs">
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {votedItems[item.id] || 100} Votes
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. SYSTEM STATUS */}
            {activeSection === "system_status" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" /> System Infrastructure & Service Status
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">All Vivexa Cloud services operational with 99.99% uptime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {[
                    { name: "Authentication & Supabase DB", status: "Operational", latency: "18ms" },
                    { name: "Gemini 2.5 Pro AI Inference Engine", status: "Operational", latency: "140ms" },
                    { name: "Dataset Storage & Cloud Buckets", status: "Operational", latency: "24ms" },
                    { name: "Notebook Kernel Sandbox", status: "Operational", latency: "42ms" },
                    { name: "Time-Series Forecast Engine", status: "Operational", latency: "65ms" },
                    { name: "REST API Gateway", status: "Operational", latency: "12ms" }
                  ].map((sys, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200 block">{sys.name}</span>
                        <span className="text-[10px] text-slate-500">Response time: {sys.latency}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {sys.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 12. ENTERPRISE SUPPORT & PRIORITY TICKETS */}
            {activeSection === "support" && (
              <div className="space-y-6 text-xs font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-rose-400" /> Enterprise Support & Priority Ticket Escalation
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct access to Vivexa SREs, AI Engineers, and 24/7 SLA Guarantees for mission-critical systems.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsPriorityModalOpen(true)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-10 px-5 rounded-xl shadow-lg flex items-center gap-2 shrink-0 border border-rose-400/30"
                  >
                    <AlertTriangle className="h-4 w-4" /> Open Priority Ticket
                  </Button>
                </div>

                {/* SLA TIER GUARANTEE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                    <span className="font-bold text-rose-400 text-xs block">P1 - Critical Outage</span>
                    <span className="text-[10px] text-slate-300 block font-mono">15-Min Response SLA</span>
                    <p className="text-[10px] text-slate-400">System down, pipeline offline, or total service disruption.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <span className="font-bold text-amber-400 text-xs block">P2 - High Severity</span>
                    <span className="text-[10px] text-slate-300 block font-mono">1-Hour Response SLA</span>
                    <p className="text-[10px] text-slate-400">Core features impaired, high latency, or model drift.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                    <span className="font-bold text-indigo-400 text-xs block">P3 - Normal Priority</span>
                    <span className="text-[10px] text-slate-300 block font-mono">4-Hour Response SLA</span>
                    <p className="text-[10px] text-slate-400">Minor bug, non-blocking workflow issue, or account question.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-300 text-xs block">P4 - Low / General</span>
                    <span className="text-[10px] text-slate-400 block font-mono">24-Hour Response SLA</span>
                    <p className="text-[10px] text-slate-400">General inquiry, documentation clarification, or feature request.</p>
                  </div>
                </div>

                {/* ACTIVE TICKETS TRACKER LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <LifeBuoy className="h-4 w-4 text-indigo-400" /> Active Priority Tickets ({tickets.length})
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Persistent Tracking ID & Auto-Escalation Enabled
                    </span>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                      <p className="text-slate-300 font-bold">No Open Support Tickets</p>
                      <p className="text-slate-500 text-xs">All platform systems and datasets are operating within SLA targets.</p>
                      <Button
                        onClick={() => setIsPriorityModalOpen(true)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8 text-xs"
                      >
                        Create New Support Ticket
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((t) => {
                        const isExpanded = selectedTicketForReply === t.id;
                        return (
                          <div
                            key={t.id}
                            className={`p-4 rounded-xl border text-xs transition-all space-y-3 ${
                              t.severity === "P1"
                                ? "bg-rose-950/20 border-rose-500/30"
                                : t.severity === "P2"
                                ? "bg-amber-950/20 border-amber-500/30"
                                : "bg-slate-950 border-slate-800"
                            }`}
                          >
                            {/* Ticket Summary Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                      t.severity === "P1"
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                        : t.severity === "P2"
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                                    }`}
                                  >
                                    {t.severity}
                                  </span>
                                  <span className="font-mono font-bold text-slate-400">{t.id}</span>
                                  <span className="font-bold text-white text-sm">{t.subject}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono flex-wrap">
                                  <span className="text-indigo-300 font-bold flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-indigo-400" /> {t.email || "info.vivexa@gmail.com"}
                                  </span>
                                  <span>•</span>
                                  <span>Category: {t.category}</span>
                                  <span>•</span>
                                  <span>Assigned: {t.assignedEngineer}</span>
                                  <span>•</span>
                                  <span>Target SLA: {t.slaMinutes} mins</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] uppercase border ${
                                    t.status === "INVESTIGATING"
                                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                      : t.status === "OPEN"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  {t.status}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTicketForReply(isExpanded ? null : t.id)}
                                  className="border-slate-800 text-slate-300 hover:bg-slate-800 text-[10px] h-7 px-2.5"
                                >
                                  {isExpanded ? "Hide Details" : `View Thread (${t.replies.length})`}
                                </Button>
                              </div>
                            </div>

                            {/* Ticket Description */}
                            <p className="text-slate-300 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-850 leading-relaxed">
                              {t.description}
                            </p>

                            {/* Expanded Discussion Thread */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-slate-800 space-y-3">
                                <span className="font-bold text-indigo-300 block text-[11px]">
                                  Official Support Audit Log & Discussion Thread:
                                </span>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                  {t.replies.map((rep) => (
                                    <div
                                      key={rep.id}
                                      className="p-3 rounded-lg bg-slate-900 border border-slate-850 space-y-1 font-mono text-[11px]"
                                    >
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-indigo-400">
                                          {rep.sender} <span className="text-slate-500">({rep.role})</span>
                                        </span>
                                        <span className="text-slate-500">
                                          {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-slate-200 font-sans text-xs leading-relaxed">{rep.message}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Reply Input Box */}
                                <div className="flex gap-2 pt-2">
                                  <Input
                                    value={ticketReplyText}
                                    onChange={(e) => setTicketReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddReply(t.id)}
                                    placeholder="Add comment or additional diagnostic info..."
                                    className="bg-slate-900 border-slate-800 text-xs text-white h-9"
                                  />
                                  <Button
                                    onClick={() => handleAddReply(t.id)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-4 text-xs shrink-0"
                                  >
                                    <Send className="h-3.5 w-3.5 mr-1" /> Post Reply
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* DIRECT SUPPORT CONTACT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                      <Mail className="h-4 w-4" /> Enterprise Support Email
                    </div>
                    <p className="text-slate-300 font-mono text-xs">info.vivexa@gmail.com</p>
                    <p className="text-[10px] text-slate-500">Monitored 24/7 with encrypted cryptographic attachment support.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <ShieldCheck className="h-4 w-4" /> Dedicated Slack / Teams Channel
                    </div>
                    <p className="text-slate-300 text-xs">#vivexa-enterprise-support</p>
                    <p className="text-[10px] text-slate-500">Real-time webhook alert routing for workspace incidents.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Activity className="h-4 w-4" /> Live Platform Status
                    </div>
                    <p className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 99.99% Systems Nominal
                    </p>
                    <p className="text-[10px] text-slate-500">Continuous telemetry monitoring across all cloud regions.</p>
                  </div>
                </div>
              </div>
            )}

            {/* FALLBACK FOR OTHER SECTIONS */}
            {!["overview", "system_architecture", "quickstart", "product_tour", "user_manual", "admin_guide", "dev_guide", "api_docs", "faq", "troubleshooting", "roadmap", "system_status", "support"].includes(activeSection) && (
              <div className="space-y-4 text-xs text-slate-300">
                <h2 className="text-xl font-bold text-white capitalize">{activeSection.replace('_', ' ')}</h2>
                <p className="text-slate-400">Complete documentation section active. All guides verified against enterprise standards.</p>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> All content verified and synced.
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* PRIORITY SUPPORT TICKET MODAL */}
      <PriorityTicketModal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}

// =========================================================================
// VIVEXA INTEGRATED CONVERGENCE PARADIGM TOUR
// =========================================================================

const CONVERGENCE_CAPABILITIES = [
  {
    id: "datahub",
    name: "Unified DataHub",
    inspiration: "Microsoft Fabric",
    icon: Database,
    tagline: "One place for every dataset, connector, and file",
    desc: "A singular, unified namespace combining live SQL databases, NoSQL streams, unstructured PDFs/images, and multi-cloud file-sync folders under a virtualized lakehouse path."
  },
  {
    id: "lakehouse",
    name: "Lakehouse Storage",
    inspiration: "Databricks",
    icon: Layers,
    tagline: "Store structured, semi-structured, and unstructured data together",
    desc: "Delta-style tiering mapping raw blobs (Bronze), validated structured tables (Silver), and aggregates (Gold) with direct ingestion from Word, PPTX, PDFs, and SOAP Web Services."
  },
  {
    id: "copilot",
    name: "AI Copilot",
    inspiration: "ThoughtSpot + Snowflake",
    icon: Bot,
    tagline: "Natural-language questions with SQL, charts, and explanations",
    desc: "An intelligent context-aware chat interface converting unstructured queries into optimized PostgreSQL/Snowflake queries, automated interactive charts, and business suggestions."
  },
  {
    id: "pipelines",
    name: "Smart Pipelines",
    inspiration: "Fabric",
    icon: Workflow,
    tagline: "Visual ETL and workflow builder with AI-assisted transformations",
    desc: "Visual sequence design for scheduling, auditing, and executing automated background worker jobs (clean nulls, strip PII, train models) with full logs."
  },
  {
    id: "workspace",
    name: "Collaborative Workspace",
    inspiration: "Hex",
    icon: Users,
    tagline: "Notebook, dashboard, chat, comments, and publishing in one",
    desc: "A real-time co-authoring workspace blending SQL cells, python execution kernels, and collaborative comments so multiple analysts can work inside the same notebook canvas."
  },
  {
    id: "semantic",
    name: "Semantic Business Layer",
    inspiration: "Looker",
    icon: BookOpen,
    tagline: "Central business metrics and glossary used consistently",
    desc: "Centrally declared metric dictionaries ensuring definitions of metrics (like EBITDA, ARR, Churn) are computed identically across dashboards, predictive agents, and query tools."
  },
  {
    id: "graph",
    name: "Knowledge Graph",
    inspiration: "Palantir",
    icon: Compass,
    tagline: "Ontology of business entities and relationships powering context-aware AI",
    desc: "An active entity-relationship mapping showing structural links between databases, files, workflows, and business KPIs to give the AI precise contextual memories."
  },
  {
    id: "associative",
    name: "Associative Exploration",
    inspiration: "Qlik",
    icon: Search,
    tagline: "Dynamic filtering and relationship discovery across all connected data",
    desc: "Interactive multi-dimensional state filters. Activating filter criteria instantly highlights linked transactions and dims unrelated attributes across independent datasets."
  },
  {
    id: "storytelling",
    name: "AI Storytelling",
    inspiration: "Tableau",
    icon: Sparkles,
    tagline: "Automatically generate executive presentations and insight narratives",
    desc: "Transforms complex statistical findings and trends into sequential, narrative-led slideshow presentations tailored for board meetings and quarterly financial reports."
  },
  {
    id: "marketplace",
    name: "Marketplace & Hub",
    inspiration: "Snowflake",
    icon: Zap,
    tagline: "Templates, dashboards, AI agents, datasets, and connectors",
    desc: "An enterprise registry of custom-made plug-and-play templates, specialized ARIMA/Prophet models, CRM sync connectors, and dashboards that deploy instantly."
  }
];

function ProductConvergenceTour() {
  const [selectedCapId, setSelectedCapId] = useState("datahub");

  // State for AI Copilot simulation
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotRunning, setCopilotRunning] = useState(false);
  const [copilotSql, setCopilotSql] = useState("");
  const [copilotChartData, setCopilotChartData] = useState<any[]>([]);

  // State for Smart Pipelines simulation
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "completed">("idle");
  const [pipelineActiveStep, setPipelineActiveStep] = useState(0);

  // State for Lakehouse Storage simulation
  const [lakehouseTier, setLakehouseTier] = useState<"bronze" | "silver" | "gold">("bronze");

  // State for Notebook simulation
  const [notebookOutput, setNotebookOutput] = useState("Run cell to execute python script...");
  const [notebookRunning, setNotebookRunning] = useState(false);

  // State for Semantic Layer
  const [selectedMetric, setSelectedMetric] = useState("EBITDA");

  // State for Knowledge Graph Info
  const [activeNode, setActiveNode] = useState<string | null>("User");

  // State for Associative Exploration
  const [assocFilters, setAssocFilters] = useState({
    region: "All",
    industry: "All",
    tier: "All"
  });

  // State for AI Storytelling slideshow
  const [activeSlide, setActiveSlide] = useState(0);

  // State for Marketplace installs
  const [installedModules, setInstalledModules] = useState<Record<string, boolean>>({});

  const triggerPipeline = () => {
    if (pipelineState === "running") return;
    setPipelineState("running");
    setPipelineProgress(0);
    setPipelineActiveStep(0);
    
    const steps = [1, 2, 3, 4];
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setPipelineActiveStep(step);
        setPipelineProgress(step * 25);
        if (step === 4) {
          setPipelineState("completed");
          toast.success("ETL Pipeline completed successfully! Gold layer updated.");
        }
      }, (idx + 1) * 1200);
    });
  };

  const executeNotebookCell = () => {
    setNotebookRunning(true);
    setNotebookOutput("Loading virtual python 3.11 kernel...");
    setTimeout(() => {
      setNotebookOutput(`Virtual VM initialized. Memory Allocated: 12.4 MB.\nExecuting: pd.DataFrame(vx.datasets.get('quarterly_revenues'))\n\n     Month      Revenue    Gross_Margin\n0  January     $240,000       78.4%\n1 February     $285,000       79.1%\n2    March     $310,000       81.2%\n\nCalculation complete. Visual rendering triggered successfully.`);
      setNotebookRunning(false);
      toast.success("Notebook cell executed successfully!");
    }, 1500);
  };

  const handleCopilotPromptClick = (prompt: string, sqlQuery: string, data: any[]) => {
    setCopilotQuery(prompt);
    setCopilotRunning(true);
    setCopilotSql("");
    setCopilotChartData([]);
    
    setTimeout(() => {
      setCopilotSql(sqlQuery);
      setCopilotChartData(data);
      setCopilotRunning(false);
      toast.success("AI Copilot generated SQL statement and visual charts!");
    }, 1200);
  };

  const toggleInstall = (modId: string, name: string) => {
    const isInst = !!installedModules[modId];
    setInstalledModules(prev => ({ ...prev, [modId]: !isInst }));
    if (!isInst) {
      toast.success(`Successfully installed and deployed "${name}" workspace plugin!`);
    } else {
      toast.info(`Removed "${name}" plugin from workspace.`);
    }
  };

  const activeCap = CONVERGENCE_CAPABILITIES.find(c => c.id === selectedCapId) || CONVERGENCE_CAPABILITIES[0];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Compass className="h-5 w-5 text-indigo-400" /> Cohesive Platform Architecture
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore how Vivexa replaces isolated point tools with an integrated workspace combining elite data architectures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: 10 Core Capabilities Menu */}
        <div className="lg:col-span-5 space-y-2 h-[550px] overflow-y-auto pr-1 custom-scrollbar">
          {CONVERGENCE_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            const isSelected = selectedCapId === cap.id;
            return (
              <button
                key={cap.id}
                onClick={() => setSelectedCapId(cap.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all relative flex gap-3 ${
                  isSelected 
                    ? "bg-slate-900 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/20" 
                    : "bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-950/80"
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-900 text-slate-400'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-100 text-xs truncate">{cap.name}</span>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded shrink-0">
                      {cap.inspiration}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold leading-tight truncate">{cap.tagline}</p>
                </div>
                {isSelected && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-xl" />
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT PANEL: Live Interactive Active Simulation */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-2xl space-y-4 min-h-[550px] flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-850 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Vivexa Convergence Simulation: {activeCap.name}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{activeCap.tagline}</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Inspired by {activeCap.inspiration}</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{activeCap.desc}</p>

            {/* LIVE SIMULATOR SWITCHBOARD RENDER */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 min-h-[300px] flex flex-col justify-center">
              
              {/* 1. DATAHUB SIMULATOR */}
              {selectedCapId === "datahub" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                    <span className="font-mono text-indigo-300">vivexa://gold-lakehouse-root/</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Virtual Synced Space Active
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {[
                      { name: "Oracle Enterprise Core DB", path: "/databases/oracle_prod_1521", type: "DB Instance", status: "Connected", size: "142 GB" },
                      { name: "Cassandra Wide Column Data", path: "/NoSQL/cassandra_9042", type: "Wide Column", status: "Connected", size: "480 GB" },
                      { name: "S3 Object Store Lake", path: "/cloud_storage/s3_enterprise", type: "Object Storage", status: "Connected", size: "2.4 TB" },
                      { name: "OneDrive Business Ingestion", path: "/sync/onedrive_quarterly", type: "File Sync", status: "Connected", size: "450 MB" },
                      { name: "SOAP XML Billing Service", path: "/apis/soap_v1_billing", type: "API Parser", status: "Connected", size: "Realtime" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <div>
                            <span className="text-slate-200 font-bold block">{item.name}</span>
                            <span className="text-[10px] text-slate-500">{item.path}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2 text-[10px]">
                          <span className="text-slate-400 font-semibold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">{item.type}</span>
                          <span className="text-emerald-400 font-bold shrink-0">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. LAKEHOUSE STORAGE SIMULATOR */}
              {selectedCapId === "lakehouse" && (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex items-center bg-slate-950 border border-slate-850 p-1 rounded-lg text-[10px] font-mono">
                    {(["bronze", "silver", "gold"] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setLakehouseTier(tier)}
                        className={`flex-1 py-1.5 rounded transition-all capitalize font-bold ${
                          lakehouseTier === tier ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tier} Storage Layer
                      </button>
                    ))}
                  </div>

                  {lakehouseTier === "bronze" && (
                    <div className="space-y-2 text-xs">
                      <p className="text-[11px] text-slate-400"><strong>Bronze Tier:</strong> Holds raw unstructured XML feeds, image files, PowerPoint files, and JSON streams exactly as ingested.</p>
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg font-mono text-[10px] text-slate-300 space-y-1">
                        <div>[Ingested] file://datasets/inventory_feed.xml (Raw Structured XML)</div>
                        <div>[Ingested] file://vault/quarterly_reports.pdf (Adobe PDF Stream)</div>
                        <div>[Ingested] file://corporate/minutes_2026.docx (Microsoft Word)</div>
                        <div className="text-amber-400 font-bold">[Status] Parsing schemas, mapping unformatted strings...</div>
                      </div>
                    </div>
                  )}

                  {lakehouseTier === "silver" && (
                    <div className="space-y-2 text-xs">
                      <p className="text-[11px] text-slate-400"><strong>Silver Tier:</strong> Formatted tables, data cleansing applied, null values handled, data types standardized, and PII columns dynamically masked.</p>
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg font-mono text-[10px] text-slate-300 space-y-1">
                        <div className="text-emerald-400">[Completed] XML tag parsing: 450 items formatted to SQL records.</div>
                        <div className="text-emerald-400">[Completed] PDF parsing: Text layout translated to embeddings.</div>
                        <div className="text-indigo-400">[PII Scrubbed] user_email transformed to hash SHA256.</div>
                        <div className="text-indigo-400">[PII Scrubbed] billing_address transformed to billing_zip_code.</div>
                      </div>
                    </div>
                  )}

                  {lakehouseTier === "gold" && (
                    <div className="space-y-2 text-xs">
                      <p className="text-[11px] text-slate-400"><strong>Gold Tier:</strong> Aggregated analytical metrics, pre-calculated business dimension keys, and materialized views optimized for ultra-fast dashboard queries.</p>
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg font-mono text-[10px] text-slate-300 space-y-2">
                        <div className="text-emerald-400">[Computed] Materialized view: `m_view_annual_revenue` [Success]</div>
                        <div className="text-emerald-400">[Computed] Fact table: `f_user_conversions` aggregated [Success]</div>
                        <div className="border-t border-slate-850 pt-2 font-bold text-slate-200">
                          Data ready to query. Sync latency: 1.2ms. Rows: 2,450,000.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. AI COPILOT SIMULATOR */}
              {selectedCapId === "copilot" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-mono font-bold block">Preselected Natural-Language Prompts:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <button
                        onClick={() => handleCopilotPromptClick(
                          "Calculate monthly conversion trends",
                          "SELECT month, SUM(conversions) AS count FROM gold.conversions GROUP BY month ORDER BY month_num;",
                          [{ label: "Jan", val: 120 }, { label: "Feb", val: 185 }, { label: "Mar", val: 245 }, { label: "Apr", val: 310 }]
                        )}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg text-left text-slate-300"
                      >
                        "Calculate monthly conversions"
                      </button>
                      <button
                        onClick={() => handleCopilotPromptClick(
                          "List top customers by total billing",
                          "SELECT customer_name, SUM(billing) AS spent FROM gold.billing GROUP BY customer_name ORDER BY spent DESC LIMIT 4;",
                          [{ label: "Acme", val: 400 }, { label: "Globex", val: 320 }, { label: "Initech", val: 280 }, { label: "Umbrella", val: 210 }]
                        )}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg text-left text-slate-300"
                      >
                        "List top customers by billing"
                      </button>
                    </div>
                  </div>

                  {copilotQuery && (
                    <div className="space-y-3 border-t border-slate-850 pt-3 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-400 font-mono">
                        <Bot className="h-4 w-4" /> AI Analyst Query: <span className="text-slate-200">"{copilotQuery}"</span>
                      </div>

                      {copilotRunning ? (
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Computing context vectors, compiling PostgreSQL parameters...
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-[9px] font-mono font-bold text-indigo-400 block mb-1">AUTOMATED SQL COMPILATION:</span>
                            <code className="text-[10px] font-mono text-emerald-400 block whitespace-pre-wrap">{copilotSql}</code>
                          </div>

                          {/* Render Dynamic Chart */}
                          {copilotChartData.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[9px] font-mono font-bold text-indigo-400 block">AI GENERATED BI CHART PREVIEW:</span>
                              <div className="flex items-end justify-between h-24 bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-[10px] font-mono">
                                {copilotChartData.map((d, i) => {
                                  const pct = (d.val / 400) * 100;
                                  return (
                                    <div key={i} className="flex flex-col items-center flex-1 space-y-1.5">
                                      <span className="text-[9px] font-bold text-indigo-300">{d.val}</span>
                                      <div className="w-6 bg-indigo-600 rounded-t" style={{ height: `${pct}%` }} />
                                      <span className="text-slate-500 font-bold">{d.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. SMART PIPELINES SIMULATOR */}
              {selectedCapId === "pipelines" && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1"><Workflow className="h-4 w-4 text-indigo-400" /> Visual ETL Execution Graph</span>
                    <Button
                      onClick={triggerPipeline}
                      disabled={pipelineState === "running"}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-7 px-3 rounded-lg text-[10px]"
                    >
                      <Play className="h-3 w-3 mr-1" /> Execute Visual ETL Flow
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    {[
                      { step: 1, name: "Bronze Ingest", icon: Database },
                      { step: 2, name: "Null Imputer", icon: Layers },
                      { step: 3, name: "PII Masking", icon: Shield },
                      { step: 4, name: "Gold Materialize", icon: Zap }
                    ].map((st) => {
                      const isPast = pipelineActiveStep >= st.step;
                      const isActive = pipelineActiveStep === st.step;
                      return (
                        <div
                          key={st.step}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                            isActive ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/20" :
                            isPast ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                            "bg-slate-950 border-slate-850 text-slate-500"
                          }`}
                        >
                          <st.icon className={`h-4 w-4 ${isActive ? 'animate-pulse text-indigo-400' : isPast ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="font-bold leading-tight block">{st.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {pipelineState !== "idle" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Pipeline execution sequence...</span>
                        <span>{pipelineProgress}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                        <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${pipelineProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. COLLABORATIVE WORKSPACE SIMULATOR */}
              {selectedCapId === "workspace" && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5"><Users className="h-4 w-4 text-indigo-400" /> Collaborative Sandbox Session</span>
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">3 Active Users Joined</span>
                  </div>

                  <div className="space-y-3">
                    {/* Collaborative Chat remarks */}
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 text-[10px]">
                      <div className="text-slate-400"><strong>@Alex (Data Scientist):</strong> Just committed pandas regression module, checking R² coefficients.</div>
                      <div className="text-slate-400"><strong>@Sophia (Business Admin):</strong> Make sure we aggregate results by sector before publishing.</div>
                      <div className="text-indigo-300"><strong>@Vivexa_Copilot:</strong> Context metrics aligned. No null records detected inside Gold warehouse.</div>
                    </div>

                    {/* Code Editor cell */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between text-[9px] text-indigo-400">
                        <span>[Python Cell 03]</span>
                        <Button
                          onClick={executeNotebookCell}
                          disabled={notebookRunning}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-5 px-2 rounded text-[9px]"
                        >
                          {notebookRunning ? "Running..." : "Run Cell"}
                        </Button>
                      </div>
                      <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto">
                        {`import pandas as pd\nimport vivexa as vx\n\ndf = pd.DataFrame(vx.datasets.get('quarterly_revenues'))\ndf.describe()`}
                      </pre>
                    </div>

                    {/* Notebook terminal output */}
                    <pre className="p-2.5 bg-slate-900 rounded border border-slate-850 text-[9px] text-slate-400 font-mono overflow-x-auto max-h-[100px]">
                      {notebookOutput}
                    </pre>
                  </div>
                </div>
              )}

              {/* 6. SEMANTIC LAYER SIMULATOR */}
              {selectedCapId === "semantic" && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1"><BookOpen className="h-4 w-4 text-indigo-400" /> Metric Glossary Registry</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded font-bold border border-emerald-500/20">AI Copilot Aligned</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {["EBITDA", "MRR", "Churn Rate", "LTV"].map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          selectedMetric === metric ? "bg-indigo-600 border-indigo-500 font-bold text-white" : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        {metric}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                    {selectedMetric === "EBITDA" && (
                      <>
                        <h4 className="font-bold text-indigo-300">Earnings Before Interest, Taxes, Depreciation, & Amortization</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">Calculates operating profitability by adding operating margins directly back to raw business depreciations.</p>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                          <code className="text-[10px] text-emerald-400 block whitespace-pre">{"EBITDA = operating_profit + depreciation_cost + amortization_cost"}</code>
                        </div>
                      </>
                    )}
                    {selectedMetric === "MRR" && (
                      <>
                        <h4 className="font-bold text-indigo-300">Monthly Recurring Revenue</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">Measures predictable normalized monthly recurring stream metrics from enterprise customer subscriptions.</p>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                          <code className="text-[10px] text-emerald-400 block whitespace-pre">{"MRR = SUM(active_customer_monthly_recurring_billing_value)"}</code>
                        </div>
                      </>
                    )}
                    {selectedMetric === "Churn Rate" && (
                      <>
                        <h4 className="font-bold text-indigo-300">Customer Churn Metric Percent</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">The ratio of customers terminated during a billing interval relative to the total opening subscribers.</p>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                          <code className="text-[10px] text-emerald-400 block whitespace-pre">{"Churn_Rate = (churned_customers / starting_active_subscribers) * 100"}</code>
                        </div>
                      </>
                    )}
                    {selectedMetric === "LTV" && (
                      <>
                        <h4 className="font-bold text-indigo-300">Customer Lifetime Value</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">The cumulative net profit contributed by an average active customer throughout their retention period.</p>
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-850">
                          <code className="text-[10px] text-emerald-400 block whitespace-pre">{"LTV = Average_Revenue_Per_User * Gross_Margin / Churn_Rate"}</code>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 7. KNOWLEDGE GRAPH SIMULATOR */}
              {selectedCapId === "graph" && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1 font-mono"><Compass className="h-4 w-4 text-indigo-400" /> Semantic Ontology Mapping</span>
                    <span className="text-[10px] text-slate-500 font-mono">Click nodes to query properties</span>
                  </div>

                  {/* Interactive Diagram Canvas */}
                  <div className="relative h-32 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex items-center justify-center">
                    
                    {/* SVG Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="15%" y1="50%" x2="40%" y2="50%" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3" />
                      <line x1="40%" y1="50%" x2="65%" y2="25%" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3" />
                      <line x1="40%" y1="50%" x2="65%" y2="75%" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3" />
                      <line x1="65%" y1="25%" x2="85%" y2="50%" stroke="#10b981" strokeWidth="1.5" />
                      <line x1="65%" y1="75%" x2="85%" y2="50%" stroke="#10b981" strokeWidth="1.5" />
                    </svg>

                    <button
                      onClick={() => setActiveNode("User")}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border font-bold ${
                        activeNode === "User" ? "bg-indigo-600 text-white border-indigo-400" : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      User Account
                    </button>

                    <button
                      onClick={() => setActiveNode("Dataset")}
                      className={`absolute left-1/3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border font-bold ${
                        activeNode === "Dataset" ? "bg-indigo-600 text-white border-indigo-400" : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      Gold Dataset
                    </button>

                    <button
                      onClick={() => setActiveNode("Model")}
                      className={`absolute right-1/4 top-3 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border font-bold ${
                        activeNode === "Model" ? "bg-indigo-600 text-white border-indigo-400" : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      ARIMA Model
                    </button>

                    <button
                      onClick={() => setActiveNode("Forecast")}
                      className={`absolute right-1/4 bottom-3 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border font-bold ${
                        activeNode === "Forecast" ? "bg-indigo-600 text-white border-indigo-400" : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      Prophet Model
                    </button>

                    <button
                      onClick={() => setActiveNode("Output")}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border font-bold ${
                        activeNode === "Output" ? "bg-indigo-600 text-white border-indigo-400" : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      Slack Advisory
                    </button>
                  </div>

                  {/* Active Node Detail Card */}
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    {activeNode === "User" && (
                      <div className="space-y-1 font-mono text-[10px]">
                        <span className="font-bold text-indigo-300">[Ontology Node] User Account Definition</span>
                        <p className="text-slate-400">Class: `Principal:Corporate_Admin`. Owns 4 projects. Triggered 14 API analytical sweeps in the last 24 hours.</p>
                      </div>
                    )}
                    {activeNode === "Dataset" && (
                      <div className="space-y-1 font-mono text-[10px]">
                        <span className="font-bold text-indigo-300">[Ontology Node] Gold Dataset Table</span>
                        <p className="text-slate-400">Class: `Warehouse:Materialized_View`. Derived from continuous PostgreSQL/Oracle Sync triggers. Rowcount: 2.45M rows.</p>
                      </div>
                    )}
                    {activeNode === "Model" && (
                      <div className="space-y-1 font-mono text-[10px]">
                        <span className="font-bold text-indigo-300">[Ontology Node] ARIMA Seasonal Predictor</span>
                        <p className="text-slate-400">Class: `Inference:ARIMA_Engine`. Automatically mapped. Dependent on column 'conversions' from Gold Dataset.</p>
                      </div>
                    )}
                    {activeNode === "Forecast" && (
                      <div className="space-y-1 font-mono text-[10px]">
                        <span className="font-bold text-indigo-300">[Ontology Node] Prophet Neural Time-Series</span>
                        <p className="text-slate-400">Class: `Inference:Prophet_Regressor`. Calculates 95% forecast confidence bands under custom holidays.</p>
                      </div>
                    )}
                    {activeNode === "Output" && (
                      <div className="space-y-1 font-mono text-[10px]">
                        <span className="font-bold text-indigo-300">[Ontology Node] Slack Advisory Hub</span>
                        <p className="text-slate-400">Class: `Integration:Notification_Webhook`. Broadcasts real-time anomalies or pipeline warnings back to Slack workspace channel.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 8. ASSOCIATIVE EXPLORATION SIMULATOR */}
              {selectedCapId === "associative" && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1"><Search className="h-4 w-4 text-indigo-400" /> Dynamic Filtering Network</span>
                    <button
                      onClick={() => setAssocFilters({ region: "All", industry: "All", tier: "All" })}
                      className="text-[9px] text-indigo-400 hover:underline"
                    >
                      Clear Selections
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Region */}
                    <div className="space-y-1.5 p-2 bg-slate-950 border border-slate-850 rounded-lg text-[10px]">
                      <span className="font-bold text-indigo-300">Region</span>
                      {["All", "West", "East"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setAssocFilters(prev => ({ ...prev, region: r }))}
                          className={`w-full py-1 px-2 rounded text-left ${
                            assocFilters.region === r ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {/* Industry */}
                    <div className="space-y-1.5 p-2 bg-slate-950 border border-slate-850 rounded-lg text-[10px]">
                      <span className="font-bold text-indigo-300">Industry</span>
                      {["All", "Tech", "Retail"].map((ind) => (
                        <button
                          key={ind}
                          onClick={() => setAssocFilters(prev => ({ ...prev, industry: ind }))}
                          className={`w-full py-1 px-2 rounded text-left ${
                            assocFilters.industry === ind ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>

                    {/* Tier */}
                    <div className="space-y-1.5 p-2 bg-slate-950 border border-slate-850 rounded-lg text-[10px]">
                      <span className="font-bold text-indigo-300">Account Tier</span>
                      {["All", "Enterprise", "MidMarket"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setAssocFilters(prev => ({ ...prev, tier: t }))}
                          className={`w-full py-1 px-2 rounded text-left ${
                            assocFilters.tier === t ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlight Feedback mapping */}
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg space-y-2 text-[10px]">
                    <span className="text-slate-400 block">Linked Dataset Records (Green = Highlighted, Dim = Excluded):</span>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {[
                        { name: "Acme Corp (West Tech Enterprise)", reg: "West", ind: "Tech", tier: "Enterprise" },
                        { name: "Globex Logistics (East Retail Enterprise)", reg: "East", ind: "Retail", tier: "Enterprise" },
                        { name: "Initech software (West Tech MidMarket)", reg: "West", ind: "Tech", tier: "MidMarket" },
                        { name: "Umbrella Store (East Retail MidMarket)", reg: "East", ind: "Retail", tier: "MidMarket" }
                      ].map((item, idx) => {
                        const regionMatch = assocFilters.region === "All" || assocFilters.region === item.reg;
                        const industryMatch = assocFilters.industry === "All" || assocFilters.industry === item.ind;
                        const tierMatch = assocFilters.tier === "All" || assocFilters.tier === item.tier;
                        const matchesAll = regionMatch && industryMatch && tierMatch;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded border font-sans font-bold transition-all ${
                              matchesAll
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow"
                                : "bg-slate-950/20 border-slate-900 text-slate-600 opacity-40"
                            }`}
                          >
                            {item.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 9. AI STORYTELLING SIMULATOR */}
              {selectedCapId === "storytelling" && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
                    <span className="font-bold text-slate-300 flex items-center gap-1"><Sparkles className="h-4 w-4 text-indigo-400" /> Automated Narrative slide Presentation</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={activeSlide === 0}
                        onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 h-6 px-2 rounded text-[10px]"
                      >
                        Prev
                      </Button>
                      <span className="text-[10px] text-slate-400">Slide {activeSlide + 1} of 3</span>
                      <Button
                        size="sm"
                        disabled={activeSlide === 2}
                        onClick={() => setActiveSlide(prev => Math.min(2, prev + 1))}
                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 h-6 px-2 rounded text-[10px]"
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 min-h-[170px] flex flex-col justify-between">
                    {activeSlide === 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">Slide 1: Executive Summary & Performance Indicators</span>
                        <h4 className="text-sm font-bold text-white">Q3 Conversion Optimization Narrative</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Enterprise customer acquisition volumes rose **14.2%** month-over-month. The primary driver is tech segment vertical optimization across the Pacific region, yielding $340k extra billing pipelines.
                        </p>
                      </div>
                    )}
                    {activeSlide === 1 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">Slide 2: Statistical Forecasts & Multi-Seasonal Trends</span>
                        <h4 className="text-sm font-bold text-white">Expected Conversion Seasonality Trends</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Applying Prophet and ARIMA models to historical transaction logs predicts a **9.4%** winter uplift, with high confidence bands indicating strong retention rates.
                        </p>
                      </div>
                    )}
                    {activeSlide === 2 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">Slide 3: Actionable Strategic Recommendations</span>
                        <h4 className="text-sm font-bold text-white">Corporate Strategic ROI Projections</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Based on statistical regressions: Restructure pricing structures inside the MidMarket segment to drive customer expansion plans. This mitigates customer churn by up to **2.4%** across EMEA regions.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-850 text-[10px] text-slate-500 font-mono">
                      <span>Format: Executive PowerPoint (.pptx)</span>
                      <span>•</span>
                      <span>Template: Executive Midnight Accent</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. MARKETPLACE SIMULATOR */}
              {selectedCapId === "marketplace" && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
                    <span className="font-bold text-slate-300 flex items-center gap-1"><Zap className="h-4 w-4 text-indigo-400" /> Marketplace Modules & Plugins</span>
                    <span className="text-[10px] text-slate-500">Add templates or models with 1 click</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "mod_1", name: "Prophet Time-Series", type: "ML Forecast Node", desc: "Arima & Prophet algorithms optimized for conversion indexes." },
                      { id: "mod_2", name: "Slack Warning Hook", type: "API Pipeline Node", desc: "Pushes real-time anomaly alerts straight to team channels." },
                      { id: "mod_3", name: "Word Document Parser", type: "Doc Extractor Node", desc: "Scrape semantic tables from unstructured enterprise Word files." },
                      { id: "mod_4", name: "SOAP Web Service Connector", type: "API Ingestion Node", desc: "Continuous mapping from SOAP XML billing interfaces." }
                    ].map((mod) => {
                      const isInstalled = !!installedModules[mod.id];
                      return (
                        <div key={mod.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-200 text-[11px] truncate">{mod.name}</span>
                              <span className="text-[8px] bg-slate-900 border border-slate-850 px-1 rounded text-indigo-300 font-mono shrink-0">{mod.type}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug mt-1">{mod.desc}</p>
                          </div>
                          
                          <Button
                            onClick={() => toggleInstall(mod.id, mod.name)}
                            className={`w-full h-7 text-[10px] font-bold mt-2 rounded-lg ${
                              isInstalled
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                          >
                            {isInstalled ? "✓ Installed" : "+ Install Plugin"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer of card */}
          <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-indigo-300 font-mono">
            <span>Enterprise Multi-Tenant Node Isolation Sandbox</span>
            <span>Region: AWS US-East • Cluster Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

