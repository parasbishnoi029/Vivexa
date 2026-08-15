import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Search, Sparkles, Database, FolderKanban, Bot, FileText, 
  Key, Users, ShieldCheck, ChevronRight, HelpCircle, ArrowUpRight, 
  CheckCircle2, Code2, Download, Lightbulb, Terminal, Layers,
  Cpu, Network, Lock, SlidersHorizontal, Share2, Copy, X, Send,
  Globe, Zap, Boxes, ArrowRight, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export interface ManualSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  steps: {
    heading: string;
    content: string;
    codeSnippet?: string;
  }[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "getting-started",
    title: "1. Workspace & Navigation",
    icon: Sparkles,
    color: "indigo",
    description: "Fundamentals of Vivexa OS, command navigation, profile configuration, and workspace sharing.",
    steps: [
      {
        heading: "Workspace Initialization & Architecture",
        content: "Upon authenticating, Vivexa provisions an enterprise-isolated workspace session. Use the left navigation sidebar to switch between Core Analytics, AI Intelligence, Enterprise Data Platform, and System Administration."
      },
      {
        heading: "Global Command Palette (Cmd + K)",
        content: "Press Cmd+K or click the top search header to trigger global vector search. Instantly jump to datasets, active projects, notebook cells, semantic definitions, or execute AI commands without clicking."
      },
      {
        heading: "Profile & Organization Settings",
        content: "Customize display names, company titles, and avatars in Settings > Profile. Workspace administrators can assign granular RBAC roles (Owner, Admin, Data Scientist, Viewer)."
      }
    ]
  },
  {
    id: "datasets",
    title: "2. Datasets, Lakehouse & Ingestion",
    icon: Database,
    color: "cyan",
    description: "Import, clean, partition, version, and manage structured and unstructured data assets.",
    steps: [
      {
        heading: "Supported Formats & Ingestion Limits",
        content: "Vivexa natively parses CSV (.csv), Excel (.xlsx), JSON (.json), and Apache Parquet (.parquet) files up to 500MB per upload with automatic column type inference.",
        codeSnippet: `// Load dataset via Vivexa JS/TS SDK
import { VivexaData } from '@vivexa/sdk';

const dataset = await VivexaData.load('Q3_Revenue_Parquet');
const summary = await dataset.getStats();`
      },
      {
        heading: "Virtual Lakehouse Engine",
        content: "Access Bronze (Raw), Silver (Sanitized), and Gold (Business Aggregated) data tiers in Vivexa Lakehouse. Supports zero-copy delta tables and real-time streaming ingestion."
      },
      {
        heading: "Automated Data Sanitization",
        content: "Use the Data Cleaning Studio to impute missing null values, deduplicate records, correct schema drift, and normalize dates and currencies before modeling."
      }
    ]
  },
  {
    id: "projects",
    title: "3. Projects, Workflows & Memory",
    icon: FolderKanban,
    color: "violet",
    description: "Organize datasets, notebooks, and models into collaborative enterprise project containers.",
    steps: [
      {
        heading: "Creating & Managing Projects",
        content: "Group related datasets, reports, and AI chat sessions into dedicated projects. Set project priority levels, custom tags, and member access permissions."
      },
      {
        heading: "Project Memory & Context Engine",
        content: "Vivexa automatically caches statistical discoveries, executive takeaways, and model metrics into Project Memory, serving as permanent context for AI reasoning."
      },
      {
        heading: "Activity Timeline & Audit Trail",
        content: "Track every operation executed within a project—file uploads, SQL queries, AI synthesis, and report exports—with millisecond-precision audit logs."
      }
    ]
  },
  {
    id: "ai-intelligence",
    title: "4. AI Intelligence, Chat & Agents",
    icon: Bot,
    color: "fuchsia",
    description: "Leverage Gemini 2.5 Pro multi-agent networks, natural language SQL, and predictive ML tools.",
    steps: [
      {
        heading: "AI Analyst & Natural Language Copilot",
        content: "Ask complex data questions in plain English. Vivexa synthesizes code, generates charts, calculates statistical confidence scores, and explains reasoning step-by-step."
      },
      {
        heading: "AI Agents Cockpit",
        content: "Deploy specialized autonomous workers: Planner Agent, SQL Agent, Python Agent, Visualization Agent, and Executive Advisor for continuous background analysis."
      },
      {
        heading: "Predictions, Forecasting & AutoML",
        content: "Train regression, classification, and time-series ARIMA models directly on your datasets with automated hyperparameter tuning and model evaluation."
      }
    ]
  },
  {
    id: "reporting",
    title: "5. Executive Reporting & Dashboards",
    icon: FileText,
    color: "amber",
    description: "Design interactive dashboards, publish executive PDF briefings, and tell data-driven stories.",
    steps: [
      {
        heading: "Interactive Dashboard Builder",
        content: "Drag and drop widgets, filter controls, KPI cards, and Recharts visualization components. Supports global date/category cross-filtering."
      },
      {
        heading: "AI Executive Briefings",
        content: "Generate board-ready executive summaries with one click. Automatically exports to high-resolution PDF briefings or PowerPoint slide packs."
      }
    ]
  },
  {
    id: "developer-ecosystem",
    title: "6. Data Connectors, SDK & MCP Server",
    icon: Terminal,
    color: "emerald",
    description: "Connect external warehouses, deploy Model Context Protocol (MCP) servers, and use REST APIs.",
    steps: [
      {
        heading: "External Warehouse Connectors",
        content: "Establish zero-copy connections to Snowflake, Google BigQuery, PostgreSQL, AWS Redshift, and Databricks with real-time schema discovery."
      },
      {
        heading: "Model Context Protocol (MCP) Integration",
        content: "Expose your Vivexa semantic layer and datasets natively to Claude, ChatGPT, or custom LLMs using our standardized MCP definition specification.",
        codeSnippet: `{
  "mcpServers": {
    "vivexa-intelligence": {
      "command": "npx",
      "args": ["-y", "@vivexa/mcp-server"],
      "env": {
        "VIVEXA_API_KEY": "vvx_live_your_key_here"
      }
    }
  }
}`
      },
      {
        heading: "Marketplace & Data Clean Rooms",
        content: "Deploy pre-built AI agents, datasets, and templates from the Vivexa Marketplace, or establish differential privacy Data Clean Rooms with external partners."
      }
    ]
  }
];

const FAQS = [
  {
    q: "How does Vivexa secure my enterprise data?",
    a: "Vivexa enforces AES-256 encryption at rest, TLS 1.3 in transit, and strict Row Level Security (RLS) policies. Raw records never leak into public AI training models."
  },
  {
    q: "What is the Model Context Protocol (MCP) server?",
    a: "The MCP server allows external desktop or cloud AI tools (like Claude Desktop or IDEs) to securely query your Vivexa semantic layer, datasets, and data fabric using natural language."
  },
  {
    q: "How do I connect external databases like Snowflake or BigQuery?",
    a: "Navigate to Platform Ecosystem > Data Connectors, select your database engine, enter read-only service credentials, and run a schema discovery scan."
  },
  {
    q: "How do I invite team members and assign RBAC roles?",
    a: "Go to Organisation > Members and click 'Add Talent' or 'Invite Member'. Select roles ranging from Viewer to Workspace Admin."
  }
];

export default function UserManual() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponses, setAiResponses] = useState<{ query: string; answer: string; time: string }[]>([
    {
      query: "How do I import a dataset and run AI forecasting?",
      answer: "1. Go to **Datasets** > **Upload Dataset** and drag in your CSV/Parquet file.\n2. Click on **Forecasting** under AI Intelligence.\n3. Select your target numeric column and date column, then click **Generate AI Forecast**.",
      time: "Just now"
    }
  ]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userPrompt = aiQuery.trim();
    setAiQuery("");
    setIsSynthesizing(true);

    setTimeout(() => {
      let answer = `Based on the official Vivexa documentation for "${userPrompt}":\n\n`;
      if (userPrompt.toLowerCase().includes("mcp") || userPrompt.toLowerCase().includes("sdk")) {
        answer += "You can configure the Vivexa Model Context Protocol (MCP) server by navigating to **Intelligence SDK**, downloading `mcp-vivexa-config.json`, and placing it in your desktop LLM client settings.";
      } else if (userPrompt.toLowerCase().includes("dataset") || userPrompt.toLowerCase().includes("upload")) {
        answer += "Vivexa supports CSV, Excel, JSON, and Apache Parquet up to 500MB. Navigate to **Datasets** to upload or inspect schema details.";
      } else if (userPrompt.toLowerCase().includes("connector") || userPrompt.toLowerCase().includes("snowflake")) {
        answer += "Go to **Platform Ecosystem > Data Connectors** to establish zero-copy data bridges to Snowflake, BigQuery, or PostgreSQL.";
      } else {
        answer += "Vivexa combines dataset management, multi-agent AI copilots, interactive Recharts dashboards, and enterprise governance. You can explore step-by-step guides in this user manual or launch the **AI Chat** module for deep dataset reasoning.";
      }

      setAiResponses(prev => [
        { query: userPrompt, answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev
      ]);
      setIsSynthesizing(false);
    }, 1000);
  };

  const filteredSections = useMemo(() => {
    return MANUAL_SECTIONS.filter(sec => {
      if (selectedSection !== "all" && sec.id !== selectedSection) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sec.title.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        sec.steps.some(s => s.heading.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
      );
    });
  }, [selectedSection, searchQuery]);

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="space-y-8 pb-16 relative z-10 max-w-6xl mx-auto px-4 sm:px-6"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 sm:p-10 rounded-[32px] bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-left">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
            <BookOpen className="h-3.5 w-3.5" /> Official Platform Guide
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-none">
            Vivexa User Manual & Documentation
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Everything you need to master Vivexa: dataset management, AI analytics, project workflows, executive reporting, and workspace security.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <Button 
            onClick={() => setIsAiAssistantOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all"
          >
            <Bot className="h-4 w-4 mr-2" />
            Ask AI Assistant
          </Button>
          <Button 
            onClick={() => navigate('/workspace/ai/chat')}
            variant="outline"
            className="border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white rounded-2xl h-12 px-5 font-bold text-xs"
          >
            Launch Copilot <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Filter & Search Bar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documentation, MCP server, API endpoints, file formats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl pl-11 pr-4 text-xs font-medium text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSection("all")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSection === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            All Topics
          </button>
          {MANUAL_SECTIONS.map((sec) => {
            const SecIcon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedSection === sec.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                <SecIcon className="h-3.5 w-3.5" />
                {sec.title.split('. ')[1]}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Manual Content Sections */}
      <motion.div variants={itemVariants} className="space-y-8">
        {filteredSections.map((section) => {
          const IconComp = section.icon;
          return (
            <Card key={section.id} className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden relative group rounded-[28px] text-left">
              <CardHeader className="p-6 md:p-8 pb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg">
                    <IconComp className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl md:text-2xl font-black text-white">{section.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {section.steps.map((step, idx) => (
                    <div 
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                          Module {idx + 1}
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">{step.heading}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{step.content}</p>
                      </div>

                      {step.codeSnippet && (
                        <div className="pt-2">
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-[10px] text-indigo-300 overflow-x-auto">
                            <pre>{step.codeSnippet}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Frequently Asked Questions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-xl shadow-xl rounded-[28px] text-left">
          <CardHeader className="p-6 md:p-8 pb-4">
            <CardTitle className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
              </div>
              Frequently Asked Questions
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Quick reference answers for enterprise operations.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Action Navigation Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/workspace/datasets">
          <Card className="bg-slate-900/40 border-slate-800/80 hover:border-indigo-500/50 transition-all p-5 flex items-center justify-between group cursor-pointer rounded-2xl text-left">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Datasets & Ingestion</h4>
                <p className="text-[10px] text-slate-500">Upload & inspect tables</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
          </Card>
        </Link>

        <Link to="/workspace/sdk">
          <Card className="bg-slate-900/40 border-slate-800/80 hover:border-indigo-500/50 transition-all p-5 flex items-center justify-between group cursor-pointer rounded-2xl text-left">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Intelligence SDK</h4>
                <p className="text-[10px] text-slate-500">MCP definition & REST APIs</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
          </Card>
        </Link>

        <Link to="/workspace/settings">
          <Card className="bg-slate-900/40 border-slate-800/80 hover:border-indigo-500/50 transition-all p-5 flex items-center justify-between group cursor-pointer rounded-2xl text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Workspace Security</h4>
                <p className="text-[10px] text-slate-500">RBAC roles & audit logs</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
          </Card>
        </Link>
      </motion.div>

      {/* ASK AI ASSISTANT MODAL DRAWER */}
      <AnimatePresence>
        {isAiAssistantOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <Bot className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Documentation AI Assistant</h3>
                    <p className="text-xs text-slate-400">Ask any question about Vivexa features, APIs, or data workflows.</p>
                  </div>
                </div>
                <button onClick={() => setIsAiAssistantOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleAskAi} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. How do I configure the MCP server for Claude?"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Button 
                  type="submit"
                  disabled={isSynthesizing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 font-bold text-xs uppercase"
                >
                  {isSynthesizing ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>

              {/* Response Log */}
              <div className="max-h-[320px] overflow-y-auto space-y-4 pr-2 scrollbar-none">
                {aiResponses.map((res, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 font-bold">
                      <span>Query: {res.query}</span>
                      <span className="text-slate-500">{res.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {res.answer}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

