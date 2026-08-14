/**
 * Vivexa Workspace Plugin & Extension Engine
 * Manages plugin lifecycle, configuration, permissions, runtime hooks,
 * and live integration points across the enterprise application.
 */

export interface PluginConfigField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  value: string;
}

export interface Plugin {
  id: string;
  name: string;
  author: string;
  category: "Visualization" | "Machine Learning" | "Forecasting" | "NLP" | "Finance" | "Marketing" | "Security" | "ETL" | "BI" | "Developer Tools";
  downloads: string;
  rating: string;
  installed: boolean;
  enabled: boolean;
  version: string;
  desc: string;
  color: string;
  permissions: string[];
  configKeys?: PluginConfigField[];
  hooks?: string[]; // Supported extension points
  customScript?: string;
  isCustom?: boolean;
}

export const INITIAL_PLUGINS: Plugin[] = [
  {
    id: "p1",
    name: "Google Gemini Pro AI Agent",
    author: "Google Cloud",
    category: "NLP",
    downloads: "42.5k",
    rating: "4.9",
    installed: true,
    enabled: true,
    version: "v2.1.0",
    color: "text-blue-400",
    desc: "Multimodal Gemini integration for automated text summarization, data extraction, and natural language SQL generation.",
    permissions: ["Read Datasets", "Generate Reports", "LLM Reasoning"],
    configKeys: [
      { key: "model", label: "Model Alias", value: "gemini-3.6-flash" },
      { key: "temperature", label: "Temperature", value: "0.2" }
    ],
    hooks: ["dataset_ai_analyst", "executive_reports", "chat_reasoning"]
  },
  {
    id: "p2",
    name: "OpenAI GPT-4o Connector",
    author: "OpenAI",
    category: "NLP",
    downloads: "38.2k",
    rating: "4.8",
    installed: true,
    enabled: true,
    version: "v3.0.1",
    color: "text-emerald-400",
    desc: "Connect OpenAI assistant endpoints for custom workspace reasoning and dataset enrichment.",
    permissions: ["Read Datasets", "Execute Code"],
    configKeys: [
      { key: "temperature", label: "Creativity Temp", value: "0.3" }
    ],
    hooks: ["dataset_ai_analyst", "chat_reasoning"]
  },
  {
    id: "p3",
    name: "Power BI Embedded Visualizer",
    author: "Microsoft",
    category: "BI",
    downloads: "28.1k",
    rating: "4.7",
    installed: true,
    enabled: true,
    version: "v1.8.0",
    color: "text-amber-400",
    desc: "Embed interactive Power BI reports and dashboards directly into Vivexa Executive Reports & Dashboards.",
    permissions: ["Embed iFrame", "Read Metrics"],
    configKeys: [
      { key: "tenant_id", label: "Azure Tenant ID", value: "a8f39102-4091" },
      { key: "workspace_id", label: "PowerBI Workspace ID", value: "pbi-sales-01" }
    ],
    hooks: ["executive_reports", "dashboard_widgets"]
  },
  {
    id: "p4",
    name: "Tableau Server Connector",
    author: "Salesforce",
    category: "BI",
    downloads: "22.4k",
    rating: "4.6",
    installed: false,
    enabled: false,
    version: "v2.0.0",
    color: "text-sky-400",
    desc: "Sync workbook views and metadata live from Tableau Cloud and On-Prem instances.",
    permissions: ["Read Dashboards"],
    hooks: ["executive_reports", "connectors"]
  },
  {
    id: "p5",
    name: "Slack Alert Dispatcher",
    author: "Slack Technologies",
    category: "Developer Tools",
    downloads: "34.8k",
    rating: "4.9",
    installed: true,
    enabled: true,
    version: "v1.4.2",
    color: "text-purple-400",
    desc: "Push real-time dataset anomaly alerts, forecast summaries, and system audit logs directly to Slack channels.",
    permissions: ["Send Messages", "Read Alerts"],
    configKeys: [
      { key: "webhook_url", label: "Slack Webhook URL", value: "https://hooks.slack.com/services/T000/B000/XXXX" },
      { key: "channel", label: "Default Channel", value: "#vivexa-alerts" }
    ],
    hooks: ["notifications_dispatch", "audit_log_export", "data_cleaning_alerts"]
  },
  {
    id: "p6",
    name: "Snowflake ELT Streaming Pipeline",
    author: "Snowflake Inc",
    category: "ETL",
    downloads: "19.3k",
    rating: "4.8",
    installed: true,
    enabled: true,
    version: "v2.2.0",
    color: "text-cyan-400",
    desc: "High-speed zero-copy data streaming into Snowflake warehouses.",
    permissions: ["Write Warehouse"],
    configKeys: [
      { key: "account", label: "Account ID", value: "xy12345.us-east-1" },
      { key: "warehouse", label: "Warehouse Name", value: "COMPUTE_WH" }
    ],
    hooks: ["data_connectors", "dataset_export"]
  },
  {
    id: "p7",
    name: "Advanced Candlestick & Ratio Charts",
    author: "Vivexa Labs",
    category: "Visualization",
    downloads: "15.9k",
    rating: "4.9",
    installed: true,
    enabled: true,
    version: "v1.1.0",
    color: "text-indigo-400",
    desc: "Interactive financial charting widgets for stock, FX, crypto series, and technical indicator overlays.",
    permissions: ["Render Canvas"],
    hooks: ["dataset_charts", "custom_visualizations"]
  },
  {
    id: "p8",
    name: "Prophet Time Series Forecasting",
    author: "Meta AI",
    category: "Forecasting",
    downloads: "27.6k",
    rating: "4.8",
    installed: true,
    enabled: true,
    version: "v1.0.4",
    color: "text-pink-400",
    desc: "Additive regression time-series forecasting model with holiday effect decomposition and trend changepoints.",
    permissions: ["Train Models"],
    hooks: ["forecasting_engine"]
  },
  {
    id: "p9",
    name: "SAP ERP Financial Connector",
    author: "SAP Enterprise",
    category: "Finance",
    downloads: "9.8k",
    rating: "4.5",
    installed: false,
    enabled: false,
    version: "v1.0.0",
    color: "text-amber-300",
    desc: "Ingest General Ledger and accounts receivable directly into workspace pipelines.",
    permissions: ["Read GL"],
    hooks: ["data_connectors"]
  },
  {
    id: "p10",
    name: "HIPAA & GDPR Data Anonymizer",
    author: "Vivexa Security",
    category: "Security",
    downloads: "11.2k",
    rating: "5.0",
    installed: true,
    enabled: true,
    version: "v2.0.0",
    color: "text-rose-400",
    desc: "Automatic PII / PHI redaction (SSN, credit cards, emails, phone numbers) for healthcare and enterprise compliance.",
    permissions: ["Redact Text", "Audit Logs"],
    configKeys: [
      { key: "redact_emails", label: "Redact Emails", value: "true" },
      { key: "redact_ssn", label: "Redact SSN / Tax IDs", value: "true" }
    ],
    hooks: ["dataset_cleaning", "privacy_shield"]
  }
];

const STORAGE_KEY = "vivexa_plugins_v3";

export class PluginEngine {
  private static eventTarget = new EventTarget();

  public static getPlugins(): Plugin[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn("Error parsing saved plugins:", e);
      }
    }
    return INITIAL_PLUGINS;
  }

  public static savePlugins(plugins: Plugin[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
    this.eventTarget.dispatchEvent(new CustomEvent("plugins_updated", { detail: plugins }));
  }

  public static isPluginActive(pluginId: string): boolean {
    const plugins = this.getPlugins();
    const p = plugins.find((x) => x.id === pluginId);
    return !!(p && p.installed && p.enabled);
  }

  public static getActivePluginsForHook(hookName: string): Plugin[] {
    const plugins = this.getPlugins();
    return plugins.filter((p) => p.installed && p.enabled && p.hooks?.includes(hookName));
  }

  public static toggleInstall(pluginId: string): Plugin[] {
    const plugins = this.getPlugins();
    const updated = plugins.map((p) => {
      if (p.id !== pluginId) return p;
      const nextState = !p.installed;
      return { ...p, installed: nextState, enabled: nextState };
    });
    this.savePlugins(updated);
    return updated;
  }

  public static toggleEnable(pluginId: string): Plugin[] {
    const plugins = this.getPlugins();
    const updated = plugins.map((p) => {
      if (p.id !== pluginId) return p;
      return { ...p, enabled: !p.enabled };
    });
    this.savePlugins(updated);
    return updated;
  }

  public static updatePluginConfig(pluginId: string, configValues: Record<string, string>): Plugin[] {
    const plugins = this.getPlugins();
    const updated = plugins.map((p) => {
      if (p.id !== pluginId) return p;
      const nextKeys = p.configKeys?.map((cfg) => ({
        ...cfg,
        value: configValues[cfg.key] !== undefined ? configValues[cfg.key] : cfg.value
      }));
      return { ...p, configKeys: nextKeys };
    });
    this.savePlugins(updated);
    return updated;
  }

  public static registerCustomPlugin(plugin: Omit<Plugin, "id"> & { id?: string }): Plugin[] {
    const plugins = this.getPlugins();
    const newId = plugin.id || `custom_p_${Date.now()}`;
    const fullPlugin: Plugin = {
      id: newId,
      name: plugin.name,
      author: plugin.author || "Custom Developer",
      category: plugin.category || "Developer Tools",
      downloads: "1 (Local)",
      rating: "5.0",
      installed: true,
      enabled: true,
      version: plugin.version || "v1.0.0",
      color: plugin.color || "text-purple-400",
      desc: plugin.desc || "Custom registered workspace plugin.",
      permissions: plugin.permissions || ["Execute Code"],
      configKeys: plugin.configKeys || [],
      hooks: plugin.hooks || ["dataset_ai_analyst"],
      customScript: plugin.customScript,
      isCustom: true
    };

    const updated = [fullPlugin, ...plugins];
    this.savePlugins(updated);
    return updated;
  }

  public static resetToDefaults(): Plugin[] {
    this.savePlugins(INITIAL_PLUGINS);
    return INITIAL_PLUGINS;
  }

  public static subscribe(callback: (plugins: Plugin[]) => void): () => void {
    const handler = (e: Event) => {
      const customEvt = e as CustomEvent<Plugin[]>;
      callback(customEvt.detail || this.getPlugins());
    };
    this.eventTarget.addEventListener("plugins_updated", handler);
    return () => this.eventTarget.removeEventListener("plugins_updated", handler);
  }
}
