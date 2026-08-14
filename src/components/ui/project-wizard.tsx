import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ChevronRight, ChevronLeft, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => Promise<void>;
}

export function ProjectWizard({ isOpen, onClose, onComplete }: WizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "finance",
    goal: "",
    currency: "USD",
    timezone: "UTC",
    units: "metric",
    theme: "indigo",
    privacy: "private"
  });

  const handleNext = async () => {
    if (step === 1 && !formData.name.trim()) {
      toast.error("Project Name is required");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onComplete(formData);
      } catch (err: any) {
        toast.error(err.message || "Failed to create project");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-2xl bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800/60 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create New Project</h2>
              <p className="text-sm text-slate-400 mt-1">Set up your workspace for analysis.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center p-6 bg-slate-900/40 border-b border-slate-800/30 relative z-10">
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${
                    step === s ? 'bg-indigo-600 text-white shadow-indigo-500/30 scale-110' : 
                    step > s ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                    'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className={`text-sm font-semibold transition-colors duration-300 ${step === s ? 'text-indigo-400' : step > s ? 'text-slate-300' : 'text-slate-500'}`}>
                    {s === 1 ? 'Basics' : s === 2 ? 'Settings' : 'Review'}
                  </span>
                </div>
                {i < 2 && <div className={`flex-1 h-px mx-4 transition-colors duration-500 ${step > s ? 'bg-indigo-500/50' : 'bg-slate-800'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto min-h-[300px] relative z-10 scrollbar-hide">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Project Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g., Q4 Revenue Analysis"
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Briefly describe what you're analyzing..."
                      className="w-full h-32 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => handleChange("industry", e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner appearance-none"
                      >
                        <option value="finance">Finance</option>
                        <option value="tech">Technology</option>
                        <option value="retail">Retail</option>
                        <option value="healthcare">Healthcare</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Business Goal</label>
                      <select
                        value={formData.goal}
                        onChange={(e) => handleChange("goal", e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner appearance-none"
                      >
                        <option value="growth">Revenue Growth</option>
                        <option value="retention">Customer Retention</option>
                        <option value="efficiency">Operational Efficiency</option>
                        <option value="risk">Risk Mitigation</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleChange("currency", e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner appearance-none"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Units</label>
                      <select
                        value={formData.units}
                        onChange={(e) => handleChange("units", e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner appearance-none"
                      >
                        <option value="metric">Metric</option>
                        <option value="imperial">Imperial</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Project Theme</label>
                    <div className="flex gap-4">
                      {['indigo', 'cyan', 'emerald', 'amber', 'rose', 'violet'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleChange("theme", color)}
                          className={`h-10 w-10 rounded-full bg-${color}-500 transition-all duration-300 shadow-lg hover:shadow-${color}-500/50 ${
                            formData.theme === color ? `ring-2 ring-white ring-offset-4 ring-offset-slate-900 scale-110 shadow-${color}-500/50` : 'hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Privacy Settings</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => handleChange("privacy", "private")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          formData.privacy === "private" ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900'
                        }`}
                      >
                        <h4 className="font-semibold text-slate-200">Private</h4>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Only you and invited members can access.</p>
                      </div>
                      <div 
                        onClick={() => handleChange("privacy", "team")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          formData.privacy === "team" ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900'
                        }`}
                      >
                        <h4 className="font-semibold text-slate-200">Team Visible</h4>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Anyone in your workspace can view this.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800/60 bg-slate-900/60 flex justify-between items-center relative z-10 backdrop-blur-xl">
            <Button 
              variant="ghost" 
              onClick={handlePrev}
              disabled={step === 1}
              className={`text-slate-400 hover:text-white rounded-xl ${step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-800'}`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[140px] rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border-0"
            >
              {step === 3 ? (
                'Create Project'
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
