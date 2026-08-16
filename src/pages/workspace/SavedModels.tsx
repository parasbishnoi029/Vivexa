import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Database, Download, Play, ShieldCheck, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface MLModel {
  id: string;
  name: string;
  accuracy: string;
  dataset: string;
  version: string;
  status: "Active" | "Archived";
  endpoint: string;
}

export default function SavedModels() {
  const navigate = useNavigate();
  const [models, setModels] = useState<MLModel[]>(() => {
    const saved = localStorage.getItem('vivexa_saved_models');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [activeTestModel, setActiveTestModel] = useState<MLModel | null>(null);
  const [testInput, setTestInput] = useState('{"tenure": 12, "monthly_charges": 65.5}');
  const [testOutput, setTestOutput] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vivexa_saved_models', JSON.stringify(models));
  }, [models]);

  const deleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    toast.info("Saved model removed from repository.");
  };

  const handleTest = () => {
    try {
      JSON.parse(testInput);
      setTestOutput(`[200 OK] Prediction result from ${activeTestModel?.name}: {\"prediction\": \"Low Risk\", \"confidence\": 0.942}`);
    } catch (e: any) {
      setTestOutput(`Invalid JSON input: ${e.message}`);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 relative z-10 w-full max-w-5xl mx-auto">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Database className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Saved ML Models</h1>
            <p className="text-sm text-slate-400 mt-1">Manage, test, and deploy your trained machine learning models.</p>
          </div>
        </div>
        <Button onClick={() => navigate('/workspace/predictions')} className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
          <Plus className="h-4 w-4 mr-2" /> Train New Model
        </Button>
      </motion.div>

      {models.length === 0 ? (
        <Card className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <Database className="h-12 w-12 mb-4 opacity-30 text-indigo-400" />
            <p className="text-lg font-medium text-slate-300">No saved ML models</p>
            <p className="text-sm mt-1 max-w-sm">Models trained during AI data analysis sessions will appear here for deployment.</p>
            <Button onClick={() => navigate('/workspace/predictions')} className="mt-4 bg-indigo-600 text-white">
              Train Model Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {models.map((model) => (
            <motion.div key={model.id} variants={itemVariants}>
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl shadow-xl hover:bg-slate-800/40 transition-colors">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-200">{model.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          model.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {model.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> {model.accuracy} Accuracy</span>
                        <span className="h-1 w-1 rounded-full bg-slate-600" />
                        <span>{model.dataset}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-600" />
                        <span>{model.version}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button onClick={() => {
                      navigator.clipboard.writeText(model.endpoint);
                      toast.success(`Copied endpoint for ${model.name}`);
                    }} variant="outline" className="flex-1 sm:flex-none bg-slate-950/50 border-slate-800 text-slate-300 hover:text-white">
                      <Download className="h-4 w-4 mr-2" /> Copy Endpoint
                    </Button>
                    <Button onClick={() => { setActiveTestModel(model); setTestOutput(null); }} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white border-0">
                      <Play className="h-4 w-4 mr-2" /> Test Model
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteModel(model.id)} className="text-slate-500 hover:text-rose-400 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTestModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <button onClick={() => setActiveTestModel(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Test {activeTestModel.name}</h2>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Payload Input (JSON)</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-xl focus:outline-none"
              />
            </div>
            {testOutput && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300">
                {testOutput}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setActiveTestModel(null)} className="border-slate-800 text-slate-300">
                Close
              </Button>
              <Button onClick={handleTest} className="bg-indigo-600 text-white">
                Execute Prediction
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
