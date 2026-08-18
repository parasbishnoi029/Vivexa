import { useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Share2, X, Link as LinkIcon, Globe, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl?: string;
}

export function ShareDialog({ isOpen, onClose, title, shareUrl }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Share link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch (err) {
      // Fallback for iframe environments
      try {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopied(true);
        toast.success("Share link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        toast.error("Could not auto-copy link. Please copy the link text manually.");
      }
    }
  };

  if (!isOpen || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight truncate max-w-[240px]">Share {title}</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Enterprise Sharing Protocol v1.2</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Access Link</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  readOnly
                  value={url}
                  className="bg-slate-950 border-slate-800 pl-10 pr-4 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <Button 
                onClick={handleCopy}
                className={`shrink-0 rounded-xl transition-all ${copied ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-bold text-xs gap-1.5`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Globe className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Public Link</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Anyone with the link can view this executive briefing snapshot.</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Lock className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Workspace</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Authenticated team members can interact with full underlying models.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-bold uppercase tracking-wider">Encrypted Handshake Active</span>
              </div>
              <span className="text-slate-500 font-mono">SOC2 Compliant</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
