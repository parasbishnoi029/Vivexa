import { motion } from "motion/react";
import { Loader2, Hexagon, Sparkles, Cpu } from "lucide-react";
import { useEffect, useState } from "react";

export function BrandLoader() {
  const [loadingText, setLoadingText] = useState("Initializing Core OS");

  useEffect(() => {
    const texts = [
      "Initializing Core OS",
      "Authenticating Secure Session",
      "Loading Enterprise Datasets",
      "Waking Neural Engine",
      "Finalizing Workspace"
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" 
      />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated 3D-like Logo Assembly */}
        <div className="relative flex items-center justify-center w-32 h-32 mb-10">
          <motion.div
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center text-indigo-500/20"
          >
            <Hexagon className="w-32 h-32 stroke-[0.5]" />
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="absolute inset-0 flex items-center justify-center text-indigo-400/40"
          >
            <Hexagon className="w-24 h-24 stroke-[1]" />
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full border border-dashed border-indigo-500/30" />
          </motion.div>
          
          {/* Inner Core */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.5, delay: 0.3 }}
            className="absolute z-20 flex items-center justify-center bg-slate-900 rounded-xl p-3 border border-slate-800 shadow-2xl shadow-indigo-500/20"
          >
            <Cpu className="w-8 h-8 text-indigo-400" />
          </motion.div>
          
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute z-10 w-16 h-16 bg-indigo-500/30 rounded-full blur-xl"
          />
        </div>

        {/* Brand Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="flex flex-col items-center gap-6"
        >
          <h2 className="text-3xl font-display font-black tracking-tight text-white flex items-center gap-3">
            Vivexa
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
              Platform
            </span>
          </h2>
          
          <div className="flex flex-col items-center gap-3 w-64">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest h-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <motion.span
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {loadingText}
              </motion.span>
            </div>
            
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
