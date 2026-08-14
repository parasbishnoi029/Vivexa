import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Network, Search, Filter, Box, Shield, Zap,
  MoreVertical, Code2, Layers, Boxes, Activity,
  Database, Plus, ChevronRight, Share2, Info,
  Globe, Fingerprint, Target, Workflow, Users,
  BarChart3, Link2, Sparkles, BrainCircuit,
  Eye, GitBranch, Terminal, LayoutDashboard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";

interface OntologyObject {
  id: string;
  name: string;
  type: "Customer" | "Transaction" | "Asset" | "Risk";
  properties: number;
  relationships: number;
  sources: number;
  status: "Active" | "Syncing";
}

const DEFAULT_OBJECTS: OntologyObject[] = [
  {
    id: "obj1",
    name: "Enterprise Customer",
    type: "Customer",
    properties: 42,
    relationships: 12,
    sources: 4,
    status: "Active"
  },
  {
    id: "obj2",
    name: "Global Transaction",
    type: "Transaction",
    properties: 84,
    relationships: 8,
    sources: 2,
    status: "Active"
  },
  {
    id: "obj3",
    name: "IoT Edge Device",
    type: "Asset",
    properties: 124,
    relationships: 5,
    sources: 1,
    status: "Syncing"
  },
  {
    id: "obj4",
    name: "Credit Default Risk",
    type: "Risk",
    properties: 12,
    relationships: 15,
    sources: 6,
    status: "Active"
  }
];

export default function Ontology() {
  const [objects, setObjects] = useState<OntologyObject[]>(DEFAULT_OBJECTS);
  const [activeView, setActiveView] = useState<"objects" | "graph" | "logic">("objects");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObject, setSelectedObject] = useState<OntologyObject | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const filteredObjects = useMemo(() => {
    return objects.filter(o => 
      o.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [objects, searchQuery]);

  return (
    <div className="space-y-8 relative z-10 w-full max-w-7xl mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400"
          >
            <Sparkles className="h-3 w-3 fill-indigo-400" /> Digital Twin Operating System
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Ontology</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Palantir-style architecture mapping physical warehouse data to semantic business objects and decision logic.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-[24px] border border-slate-800 backdrop-blur-xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-slate-500 hover:text-white rounded-[18px] mr-2"
            onClick={() => setIsShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {[
            { id: 'objects', label: 'Object Classes', icon: Boxes },
            { id: 'graph', label: 'Object Graph', icon: Network },
            { id: 'logic', label: 'Action Logic', icon: Zap }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-xs font-bold transition-all relative ${
                activeView === view.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <view.icon className="h-4 w-4" />
              {view.label}
              {activeView === view.id && (
                <motion.div 
                  layoutId="activeView"
                  className="absolute inset-0 bg-indigo-600 rounded-[18px] -z-10 shadow-lg shadow-indigo-500/20" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === "objects" && (
          <motion.div 
            key="objects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredObjects.map((obj) => (
              <Card 
                key={obj.id} 
                onClick={() => setSelectedObject(obj)}
                className={`bg-slate-900/40 border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group rounded-[32px] overflow-hidden ${selectedObject?.id === obj.id ? 'ring-2 ring-indigo-500/40 border-indigo-500/40' : ''}`}
              >
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      {obj.type === "Customer" && <Users className="h-6 w-6 text-blue-400" />}
                      {obj.type === "Transaction" && <Activity className="h-6 w-6 text-emerald-400" />}
                      {obj.type === "Asset" && <Box className="h-6 w-6 text-amber-400" />}
                      {obj.type === "Risk" && <Shield className="h-6 w-6 text-rose-400" />}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${obj.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {obj.status}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">{obj.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{obj.type} Object Class</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/60">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Props</span>
                      <span className="text-sm font-bold text-white">{obj.properties}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Links</span>
                      <span className="text-sm font-bold text-white">{obj.relationships}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Sources</span>
                      <span className="text-sm font-bold text-white">{obj.sources}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card className="bg-slate-950 border-dashed border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col items-center justify-center p-12 rounded-[32px]">
              <Plus className="h-10 w-10 text-slate-700 group-hover:text-indigo-400 transition-colors" />
              <p className="text-sm font-bold text-slate-600 mt-4 uppercase tracking-widest">Map New Class</p>
            </Card>
          </motion.div>
        )}

        {activeView === "graph" && (
          <motion.div 
            key="graph"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="h-[650px] bg-slate-950 border border-slate-800 rounded-[40px] relative overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            {/* Mock Digital Twin Graph */}
            <div className="relative z-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="relative h-[400px] w-[400px] rounded-full border border-slate-800/60"
              >
                {/* Orbital Objects */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(200px) rotate(-${angle}deg)`
                    }}
                  >
                    <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Core Object */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="p-8 rounded-[40px] bg-indigo-600/10 border border-indigo-500/40 shadow-[0_0_80px_rgba(99,102,241,0.2)] backdrop-blur-xl"
                >
                  <BrainCircuit className="h-16 w-16 text-indigo-400" />
                </motion.div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Core Digital Twin</h3>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Master Orchestrator</p>
                </div>
              </div>
            </div>

            {/* Graph Controls Overlay */}
            <div className="absolute top-8 left-8 flex items-center gap-4">
              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between gap-8">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Graph Density</span>
                  <span className="text-xs font-bold text-white">High</span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Relationship Types</span>
                  <span className="text-xs font-bold text-white">Semantic</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 flex items-center gap-3">
              <Button variant="outline" className="bg-slate-900/80 border-slate-800 text-slate-300 rounded-xl text-xs font-bold">Zoom Out</Button>
              <Button variant="outline" className="bg-slate-900/80 border-slate-800 text-slate-300 rounded-xl text-xs font-bold">Center View</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold h-9">Export Topology</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logic Layer Section */}
      <div className="pt-12 border-t border-slate-800/60">
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ontology Logic Layers</h2>
            <p className="text-sm text-slate-500 font-medium">Define prescriptive actions that trigger based on object relationship state changes.</p>
          </div>
          <Button variant="outline" className="bg-slate-900/40 border-slate-800 text-slate-300 rounded-2xl h-12 px-8 font-bold">
            <Plus className="h-4 w-4 mr-2" /> Define New Action
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Predictive Churn Logic", type: "Prescriptive", icon: Target, desc: "Triggers if Customer object 'Usage Velocity' drops below threshold." },
            { label: "Liquidity Optimizer", type: "Operational", icon: Activity, desc: "Rebalances Transaction objects across global share pools daily." },
            { label: "Risk Mitigation Flow", type: "Governance", icon: Shield, desc: "Automatic lockdown of Asset objects if anomaly detected by AI." }
          ].map((logic, i) => (
            <Card key={i} className="bg-slate-900/20 border-slate-800/40 hover:border-slate-700 transition-all rounded-[32px] overflow-hidden group">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <logic.icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-widest">{logic.type}</span>
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">{logic.label}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{logic.desc}</p>
                <div className="pt-4 flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-lg">View Blueprint</Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-slate-500 hover:text-white rounded-lg">Exec History</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title="Enterprise Ontology"
      />
    </div>
  );
}
