import { useState, useEffect } from "react";
import { PluginEngine, Plugin } from "@/lib/pluginEngine";

export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>(() => PluginEngine.getPlugins());

  useEffect(() => {
    const unsubscribe = PluginEngine.subscribe((updatedPlugins) => {
      setPlugins(updatedPlugins);
    });
    return unsubscribe;
  }, []);

  const isPluginActive = (id: string) => {
    const p = plugins.find((x) => x.id === id);
    return !!(p && p.installed && p.enabled);
  };

  const getActivePluginsForHook = (hookName: string) => {
    return plugins.filter((p) => p.installed && p.enabled && p.hooks?.includes(hookName));
  };

  return {
    plugins,
    isPluginActive,
    getActivePluginsForHook,
    toggleInstall: (id: string) => PluginEngine.toggleInstall(id),
    toggleEnable: (id: string) => PluginEngine.toggleEnable(id),
    updatePluginConfig: (id: string, values: Record<string, string>) => PluginEngine.updatePluginConfig(id, values),
    registerCustomPlugin: (p: Omit<Plugin, "id">) => PluginEngine.registerCustomPlugin(p),
    resetToDefaults: () => PluginEngine.resetToDefaults()
  };
}
