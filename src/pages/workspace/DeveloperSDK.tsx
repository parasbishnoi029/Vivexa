import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Code2, Terminal, Cpu, Network, Sparkles, 
  ChevronRight, Copy, Check, Download, ExternalLink,
  BookOpen, Box, Layers, Globe, Shield, Zap,
  Server, Laptop, Smartphone, Command, Database,
  Workflow, Boxes, Key, Activity, BrainCircuit
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";

export default function DeveloperSDK() {
  const [activeTab, setActiveTab] = useState<"sdk" | "mcp" | "api" | "cli">("sdk");
  const [copied, setCopied] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleCopy = (text: string, label?: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(label ? `Copied ${label}` : "Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (e) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success(label ? `Copied ${label}` : "Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sdkCode = `import { Vivexa } from "@vivexa/sdk";

const client = new Vivexa({
  apiKey: process.env.VIVEXA_API_KEY,
  workspaceId: "ws_482930"
});

// Run an autonomous agent task
const result = await client.agents.execute({
  agentId: "strategy-analyst-v2",
  task: "Synthesize Q4 revenue trends across APAC region",
  context: {
    includeLineage: true,
    confidenceThreshold: 0.95
  }
});

console.log(result.synthesis);`;

  return (
    <div className="space-y-8 relative z-10 w-full max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-[40px] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-12 lg:p-20 text-left">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-violet-600/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 opacity-5 pointer-events-none text-left">
          <Command className="h-[500px] w-[500px] text-white" />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-8 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400"
          >
            <Sparkles className="h-3 w-3 fill-indigo-400" /> Developer Portal
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tight leading-tight">
              Build with the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Intelligence SDK</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
              The Enterprise SDK for AI-Native Decision Intelligence. Orchestrate agents, query the semantic layer, and manage ontologies programmatically.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] px-8 h-14 font-bold text-lg shadow-xl shadow-indigo-500/20">
              Get Started
            </Button>
            <Button 
              variant="outline" 
              className="border-slate-800 bg-slate-900/50 text-white rounded-[20px] px-8 h-14 font-bold text-lg hover:bg-slate-800"
              onClick={() => setIsShareDialogOpen(true)}
            >
              Share Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-[24px] border border-slate-800 backdrop-blur-xl sticky top-24 z-30 w-fit mx-auto shadow-2xl">
        {[
          { id: 'sdk', label: 'Enterprise SDK', icon: Code2 },
          { id: 'mcp', label: 'MCP Server', icon: Server },
          { id: 'api', label: 'REST & GraphQL', icon: Globe },
          { id: 'cli', label: 'Vivexa CLI', icon: Terminal }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-xs font-bold transition-all relative ${
              activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeDevTab"
                className="absolute inset-0 bg-indigo-600 rounded-[18px] -z-10 shadow-lg shadow-indigo-500/20" 
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "sdk" && (
          <motion.div 
            key="sdk"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="space-y-4 text-left">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Full-Stack Intelligence</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                  Vivexa's TypeScript SDK is designed for enterprise grade applications. It provides strong typing, native multi-agent orchestration, and seamless integration with the semantic layer.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Native Orchestration", desc: "Build complex multi-agent workflows with single-line execution." },
                  { title: "Semantic Projection", desc: "Query business objects directly without writing raw SQL." },
                  { title: "Enterprise Security", desc: "Built-in RBAC and row-level security enforcement at the edge." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 group hover:border-indigo-500/30 transition-all text-left">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{f.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-slate-950 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                  <span className="text-[10px] font-bold text-slate-500 ml-2 font-mono uppercase tracking-widest">example.ts</span>
                </div>
                <button onClick={() => handleCopy(sdkCode)} className="text-slate-500 hover:text-white transition-colors">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <CardContent className="p-0">
                <pre className="p-8 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed text-left">
                  <code>{sdkCode}</code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "mcp" && (
          <motion.div 
            key="mcp"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-8"
          >
            <Card className="bg-gradient-to-br from-indigo-900/20 via-slate-950 to-slate-950 border-indigo-500/20 rounded-[40px] p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <div className="h-20 w-20 rounded-[28px] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                  <Server className="h-10 w-10 text-indigo-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight">Vivexa MCP Server</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  The Model Context Protocol (MCP) allows external LLMs to natively access your Vivexa ontology, semantic definitions, and data fabric.
                </p>
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([JSON.stringify({
                        "mcpServers": {
                          "vivexa-intelligence": {
                            "command": "npx",
                            "args": ["-y", "@vivexa/mcp-server"],
                            "env": {
                              "VIVEXA_API_KEY": "vvx_live_your_key_here"
                            }
                          }
                        }
                      }, null, 2)], {type: 'application/json'});
                      element.href = URL.createObjectURL(file);
                      element.download = "mcp-vivexa-config.json";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                      toast.success("Downloaded mcp-vivexa-config.json");
                    }}
                    className="bg-white text-indigo-950 hover:bg-indigo-50 rounded-[20px] px-8 h-14 font-black shadow-xl shadow-indigo-500/10"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download MCP Config
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleCopy(`{\n  "mcpServers": {\n    "vivexa-intelligence": {\n      "command": "npx",\n      "args": ["-y", "@vivexa/mcp-server"],\n      "env": {\n        "VIVEXA_API_KEY": "vvx_live_your_key"\n      }\n    }\n  }\n}`, 'mcp-json');
                    }}
                    className="border-slate-800 bg-slate-900/50 text-white rounded-[20px] px-8 h-14 font-bold hover:bg-slate-800"
                  >
                    Copy JSON Spec
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Context Injection", icon: BrainCircuit, desc: "Inject real-time warehouse data into any MCP-compatible LLM session." },
                { title: "Action Execution", icon: Zap, desc: "Allow external models to trigger Vivexa Workflows safely." },
                { title: "Ontology Sync", icon: Network, desc: "Synchronize object relationship graphs across agent ecosystems." }
              ].map((m, i) => (
                <div key={i} className="p-8 rounded-[32px] bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto">
                    <m.icon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight">{m.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{m.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "api" && (
          <motion.div 
            key="api"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">REST & GraphQL Endpoints</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                  Integrate Vivexa directly into your data pipelines and backend applications using our secure RESTful endpoints or flexible GraphQL schema.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">GET</span>
                    <span className="text-slate-200 font-semibold">/api/v1/datasets</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("curl -H 'Authorization: Bearer YOUR_API_KEY' https://api.vivexa.ai/api/v1/datasets", "api-1")} className="h-8 text-[10px]">
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy cURL
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">POST</span>
                    <span className="text-slate-200 font-semibold">/api/v1/ai/synthesize</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("curl -X POST -H 'Authorization: Bearer YOUR_API_KEY' -H 'Content-Type: application/json' -d '{\"query\":\"Predict Q4 churn\"}' https://api.vivexa.ai/api/v1/ai/synthesize", "api-2")} className="h-8 text-[10px]">
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy cURL
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">POST</span>
                    <span className="text-slate-200 font-semibold">/graphql</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy("query { projects { id name datasets { id filename } } }", "api-3")} className="h-8 text-[10px]">
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy Query
                  </Button>
                </div>
              </div>
            </div>

            <Card className="bg-slate-950 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400">Response Payload (200 OK)</span>
                <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => handleCopy(`{\n  "status": "success",\n  "executionTimeMs": 42,\n  "data": {\n    "workspaceId": "ws_enterprise_99",\n    "activeAgents": 8,\n    "semanticConfidence": 0.992\n  }\n}`, "rest-res")}>
                  <Copy className="h-3 w-3 mr-1" /> Copy JSON
                </Button>
              </div>
              <CardContent className="p-6">
                <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                  <code>{`{
  "status": "success",
  "executionTimeMs": 42,
  "data": {
    "workspaceId": "ws_enterprise_99",
    "activeAgents": 8,
    "semanticConfidence": 0.992,
    "datasets": [
      {
        "id": "ds_rev_2026",
        "name": "Q3_Enterprise_Revenue.parquet",
        "rowCount": 1450000
      }
    ]
  }
}`}</code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "cli" && (
          <motion.div 
            key="cli"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 text-left"
          >
            <div className="max-w-2xl space-y-4">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Vivexa Command Line Interface</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Manage workspace resources, deploy AI agents, and trigger local data syncs right from your developer terminal.
              </p>
            </div>

            <Card className="bg-slate-950 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl p-6 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-bold">$ npm install -g @vivexa/cli</span>
                <Button size="sm" variant="ghost" onClick={() => handleCopy("npm install -g @vivexa/cli && vivexa auth login", "cli-inst")} className="h-7 text-[10px]">
                  <Copy className="h-3 w-3 mr-1" /> Copy Command
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <span className="text-indigo-400 font-bold">$ vivexa workspace sync</span>
                  <p className="text-slate-400 pl-4"># Synchronizes local directory with remote enterprise Lakehouse</p>
                </div>

                <div className="space-y-1">
                  <span className="text-indigo-400 font-bold">$ vivexa agents deploy --config ./agent.yaml</span>
                  <p className="text-slate-400 pl-4"># Deploys a custom AI agent worker to the workspace cluster</p>
                </div>

                <div className="space-y-1">
                  <span className="text-indigo-400 font-bold">$ vivexa query --prompt "Analyze Q3 APAC sales trend"</span>
                  <p className="text-slate-400 pl-4"># Runs natural language query directly from bash terminal</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title="Developer Intelligence Portal"
      />
    </div>
  );
}
