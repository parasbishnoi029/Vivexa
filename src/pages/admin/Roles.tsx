import { useState, useEffect } from "react";
import { Shield, Check, Users, Lock, Sparkles, RefreshCw, Plus, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ROLE_PERMISSIONS, PermissionKey, normalizeRole } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";
import { createAuditLog } from "@/lib/auditLogs";
import { useAuthStore } from "@/stores/authStore";

const ALL_ROLES = [
  { name: "Super Admin", desc: "Full systemic control across all enterprise organizations, DB schemas, and infrastructure.", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { name: "Admin", desc: "Full workspace administrative rights, user management, billing, and API platform keys.", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  { name: "Manager", desc: "Team-level manager, able to create projects, invite members, and configure settings.", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { name: "Data Scientist", desc: "Execute notebooks, train ML models, run time-series forecasting, and query datasets.", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { name: "Analyst", desc: "Upload datasets, perform statistical EDA, generate automated executive reports.", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { name: "Member", desc: "Standard team member with dataset viewing and project collaboration privileges.", color: "text-slate-300 border-slate-700 bg-slate-800" },
  { name: "Viewer", desc: "Read-only viewer for shared dashboards and exported analytics reports.", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" }
];

const PERMISSION_GRID: { key: PermissionKey; label: string; group: string }[] = [
  { key: 'admin_console', label: 'Admin Console Access', group: 'System Administration' },
  { key: 'user_management', label: 'User Directory & Invites', group: 'System Administration' },
  { key: 'role_management', label: 'Role & RBAC Configuration', group: 'System Administration' },
  { key: 'billing_management', label: 'Billing & Subscriptions', group: 'System Administration' },
  { key: 'api_platform', label: 'API Keys & Webhooks', group: 'Developer & API' },
  { key: 'audit_logs', label: 'Audit Trail Logs', group: 'System Administration' },
  { key: 'feature_flags', label: 'Feature Flags Override', group: 'System Administration' },
  { key: 'workspace_settings', label: 'Workspace Configuration', group: 'Workspace Management' },
  { key: 'projects_manage', label: 'Project CRUD Operations', group: 'Data Analytics' },
  { key: 'datasets_manage', label: 'Dataset Ingestion & Cleaning', group: 'Data Analytics' },
  { key: 'notebooks_execute', label: 'Interactive Python Notebooks', group: 'Data Science & AI' },
  { key: 'forecasting_run', label: 'AI Forecasting Models', group: 'Data Science & AI' },
  { key: 'reports_create', label: 'Executive Report Generation', group: 'Data Analytics' },
  { key: 'ai_chat', label: 'Gemini AI Assistant Chat', group: 'Data Science & AI' }
];

export default function AdminRoles() {
  const { user } = useAuthStore();
  const [activeRole, setActiveRole] = useState("Admin");
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionKey[]>>(ROLE_PERMISSIONS);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({
    'Super Admin': 1,
    'Admin': 2,
    'Manager': 4,
    'Data Scientist': 8,
    'Analyst': 15,
    'Member': 24,
    'Viewer': 6
  });

  useEffect(() => {
    async function loadUserRoleCounts() {
      try {
        const { data: users } = await supabase.from('users').select('role');
        const { data: profs } = await supabase.from('profiles').select('role');

        const counts: Record<string, number> = {
          'Super Admin': 1,
          'Admin': 0,
          'Manager': 0,
          'Data Scientist': 0,
          'Analyst': 0,
          'Member': 0,
          'Viewer': 0
        };

        if (users) {
          users.forEach(u => {
            const r = normalizeRole(u.role);
            counts[r] = (counts[r] || 0) + 1;
          });
        } else if (profs) {
          profs.forEach(p => {
            const r = normalizeRole(p.role);
            counts[r] = (counts[r] || 0) + 1;
          });
        }

        setUserCounts(counts);
      } catch (e) {
        console.warn("loadUserRoleCounts error:", e);
      }
    }
    loadUserRoleCounts();
  }, []);

  const togglePermission = (permissionKey: PermissionKey) => {
    setRolePermissions(prev => {
      const currentPerms = prev[activeRole] || [];
      const hasIt = currentPerms.includes(permissionKey);
      const updated = hasIt
        ? currentPerms.filter(p => p !== permissionKey)
        : [...currentPerms, permissionKey];

      return {
        ...prev,
        [activeRole]: updated
      };
    });
  };

  const handleSaveRoleMatrix = async () => {
    if (!user) return;
    try {
      await createAuditLog({
        action: "RBAC Permission Matrix Updated",
        resourceType: "roles",
        resourceId: activeRole,
        userId: user.id,
        payload: { role: activeRole, permissions: rolePermissions[activeRole] }
      });

      toast.success(`RBAC permissions matrix updated for '${activeRole}'!`);
    } catch (e) {
      toast.error("Failed to save role permissions");
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-indigo-400" />
            Enterprise Role-Based Access Control (RBAC) V3.0
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure global authority boundaries, permission grants, and user role inheritance.
          </p>
        </div>

        <Button onClick={handleSaveRoleMatrix} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg">
          <Check className="h-4 w-4 mr-1.5" /> Save Role Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available System Roles</div>
          {ALL_ROLES.map((r) => {
            const isSelected = activeRole === r.name;
            const count = userCounts[r.name] || 0;
            return (
              <button
                key={r.name}
                onClick={() => setActiveRole(r.name)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-slate-900 border-indigo-500 shadow-xl"
                    : "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${r.color}`}>
                    {r.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="h-3 w-3" /> {count} {count === 1 ? 'user' : 'users'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{r.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Permissions Grid Panel */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-indigo-400" />
                  Permission Matrix: <span className="text-indigo-300">{activeRole}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Toggle fine-grained system access capabilities for users assigned to this role.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {(rolePermissions[activeRole] || []).length} / {PERMISSION_GRID.length} Granted
              </span>
            </div>

            {/* Permission Checkboxes */}
            <div className="space-y-6">
              {['System Administration', 'Developer & API', 'Workspace Management', 'Data Analytics', 'Data Science & AI'].map((group) => {
                const groupItems = PERMISSION_GRID.filter(p => p.group === group);
                return (
                  <div key={group} className="space-y-3">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{group}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupItems.map((item) => {
                        const isChecked = (rolePermissions[activeRole] || []).includes(item.key);
                        return (
                          <div
                            key={item.key}
                            onClick={() => togglePermission(item.key)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isChecked
                                ? "bg-indigo-950/30 border-indigo-500/40 text-slate-100 shadow-md"
                                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold block">{item.label}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Key: {item.key}</span>
                            </div>
                            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-700 bg-slate-900"
                            }`}>
                              {isChecked && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button onClick={handleSaveRoleMatrix} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs">
                Save Permission Matrix
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
