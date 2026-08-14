const fs = require('fs');
const content = fs.readFileSync('src/pages/workspace/Settings.tsx', 'utf8');

const newTabs = `const TABS = [
  { id: "overview", label: "Settings Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile Settings", icon: User },
  { id: "workspace", label: "Workspace & Region", icon: Building },
  { id: "organization", label: "Organization & Teams", icon: Users },
  { id: "security", label: "Security & 2FA", icon: Shield },
  { id: "sessions", label: "Active Sessions", icon: Smartphone },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "storage", label: "Storage Analytics", icon: HardDrive },
  { id: "usage", label: "Usage & Limits", icon: BarChart2 },
  { id: "subscription", label: "Subscription & Plan", icon: Zap },
  { id: "billing", label: "Billing & Invoices", icon: CreditCard },
  { id: "apikeys", label: "API Keys & Secrets", icon: Key },
  { id: "accounts", label: "Connected Accounts", icon: LinkIcon },
  { id: "devices", label: "Connected Devices", icon: Laptop },
  { id: "ai_prefs", label: "AI Engine Preferences", icon: Sparkles },
  { id: "privacy", label: "Privacy & Data Policy", icon: Lock },
  { id: "backup", label: "Export & Backup", icon: Download }
];`;

const updatedContent = content.replace(/const TABS = \[[\s\S]*?\];/, newTabs);
fs.writeFileSync('src/pages/workspace/Settings.tsx', updatedContent);
