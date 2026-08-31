import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw, Check, X } from "lucide-react";
import { DashboardDisplayPreferences, DEFAULT_DISPLAY_PREFERENCES } from "./types";

interface DashboardDisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DashboardDisplayPreferences;
  onSavePreferences: (prefs: DashboardDisplayPreferences) => void;
}

export const DashboardDisplaySettingsModal: React.FC<DashboardDisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [localPrefs, setLocalPrefs] = React.useState<DashboardDisplayPreferences>(preferences);

  React.useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences, isOpen]);

  const handleToggle = (key: keyof DashboardDisplayPreferences) => {
    if (key === 'density') return;
    setLocalPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDensityChange = (density: 'comfortable' | 'compact') => {
    setLocalPrefs(prev => ({ ...prev, density }));
  };

  const handleSave = () => {
    onSavePreferences(localPrefs);
    onClose();
  };

  const handleReset = () => {
    setLocalPrefs(DEFAULT_DISPLAY_PREFERENCES);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl space-y-5 relative"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-indigo-400" />
                Dashboard Display Settings
              </h3>
              <p className="text-xs text-slate-400">
                Customize information density and toggle visibility of dashboard modules.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Density Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Layout Density
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDensityChange('comfortable')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    localPrefs.density === 'comfortable'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Comfortable</span>
                  {localPrefs.density === 'comfortable' && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleDensityChange('compact')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    localPrefs.density === 'compact'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Compact</span>
                  {localPrefs.density === 'compact' && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              </div>
            </div>

            {/* Section Visibility Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Visible Modules
              </label>
              <div className="space-y-1.5 bg-slate-950 border border-slate-800 rounded-xl p-3">
                {[
                  { key: 'showSparklines' as const, label: '30-Day Trend Sparklines in KPI Cards' },
                  { key: 'showInsightsCard' as const, label: 'Insights of the Day AI Summary' },
                  { key: 'showQuickPrompts' as const, label: 'Suggested AI Copilot Prompts' },
                  { key: 'showRecentProjects' as const, label: 'Active Workspace Initiatives' },
                  { key: 'showRecentDatasets' as const, label: 'Connected Datasets Grid' },
                ].map(item => (
                  <label 
                    key={item.key} 
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs transition-colors"
                  >
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={!!localPrefs[item.key]}
                      onChange={() => handleToggle(item.key)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs border-slate-800 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                Apply
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
