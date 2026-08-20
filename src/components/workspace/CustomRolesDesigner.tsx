import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Key, Check, X, Plus, Copy, Trash2, Edit3,
  Sliders, Lock, Database, Cpu, FileText, Users, Eye, Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { WorkspaceMember } from "@/pages/workspace/Organization";

export interface CustomRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  color: string;
  permissions: Record<string, boolean>;
  assignedMemberCount?: number;
}

interface CustomRolesDesignerProps {
  members: WorkspaceMember[];
  onUpdateRoles?: (roles: CustomRoleDefinition[]) => void;
}

export const PERMISSION_CATEGORIES = [
  {
    category: "Data & Lakehouse",
    icon: Database,
    permissions: [
      { key: "lakehouse_read", label: "Read Datasets & Tables", desc: "View tables, lineage graphs, and schemas" },
      { key: "lakehouse_write", label: "Write & Mutate Datasets", desc: "Upload CSV/Parquet and append or edit data" },
      { key: "lakehouse_delete", label: "Drop Tables & Purge", desc: "Permanently delete dataset schemas" },
      { key: "query_pushdown", label: "Execute Distributed Pushdown", desc: "Run Arrow queries on remote engines" },
    ]
  },
  {
    category: "AI, Models & Notebooks",
    icon: Cpu,
    permissions: [
      { key: "notebook_execute", label: "Run Python MicroVM Cells", desc: "Execute code inside WASM MicroVM pods" },
      { key: "model_train", label: "Train & Fit ML Models", desc: "Execute Bayesian and causal model fits" },
      { key: "gemini_copilot", label: "Invoke Gemini AI Assistant", desc: "Use server-side generative AI copilot" },
      { key: "api_keys_manage", label: "Generate & Revoke API Keys", desc: "Create developer programmatic tokens" },
    ]
  },
  {
    category: "Executive Reports & Dashboards",
    icon: FileText,
    permissions: [
      { key: "reports_view", label: "View Executive Briefings", desc: "Read synthesized reports and dashboards" },
      { key: "reports_synthesize", label: "Generate & Synthesize Reports", desc: "Trigger multi-pass analytical synthesis" },
      { key: "reports_export_pdf", label: "Export Paginated PDF", desc: "Generate print-ready executive dossiers" },
      { key: "reports_export_ppt", label: "Export 16:9 PowerPoint", desc: "Build modular PPTX slide decks" },
    ]
  },
  {
    category: "Governance, Security & Audit",
    icon: Shield,
    permissions: [
      { key: "members_invite", label: "Invite & Provision Talent", desc: "Dispatch email invites to workspace" },
      { key: "members_role_modify", label: "Reassign Roles & Scopes", desc: "Promote or demote member access" },
      { key: "audit_logs_view", label: "Inspect Audit Trail", desc: "Review tamper-evident security logs" },
      { key: "sso_configure", label: "Configure SAML / SCIM SSO", desc: "Manage IdP enterprise authentication" },
    ]
  }
];

const INITIAL_ROLES: CustomRoleDefinition[] = [
  {
    id: "role-owner",
    name: "Owner",
    description: "Full root administrative control over workspace, billing, SSO, and datasets.",
    isSystem: true,
    color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    permissions: {
      lakehouse_read: true, lakehouse_write: true, lakehouse_delete: true, query_pushdown: true,
      notebook_execute: true, model_train: true, gemini_copilot: true, api_keys_manage: true,
      reports_view: true, reports_synthesize: true, reports_export_pdf: true, reports_export_ppt: true,
      members_invite: true, members_role_modify: true, audit_logs_view: true, sso_configure: true
    }
  },
  {
    id: "role-admin",
    name: "Admin",
    description: "Operational management, member onboarding, and analytics configuration.",
    isSystem: true,
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    permissions: {
      lakehouse_read: true, lakehouse_write: true, lakehouse_delete: false, query_pushdown: true,
      notebook_execute: true, model_train: true, gemini_copilot: true, api_keys_manage: true,
      reports_view: true, reports_synthesize: true, reports_export_pdf: true, reports_export_ppt: true,
      members_invite: true, members_role_modify: true, audit_logs_view: true, sso_configure: false
    }
  },
  {
    id: "role-analyst",
    name: "Analyst",
    description: "Query execution, data exploration, report synthesis, and dashboard authoring.",
    isSystem: true,
    color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    permissions: {
      lakehouse_read: true, lakehouse_write: false, lakehouse_delete: false, query_pushdown: true,
      notebook_execute: true, model_train: false, gemini_copilot: true, api_keys_manage: false,
      reports_view: true, reports_synthesize: true, reports_export_pdf: true, reports_export_ppt: true,
      members_invite: false, members_role_modify: false, audit_logs_view: false, sso_configure: false
    }
  },
  {
    id: "role-datascientist",
    name: "Data Scientist",
    description: "Full Python MicroVM pod access, statistical diagnostics, and ML model training.",
    isSystem: true,
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    permissions: {
      lakehouse_read: true, lakehouse_write: true, lakehouse_delete: false, query_pushdown: true,
      notebook_execute: true, model_train: true, gemini_copilot: true, api_keys_manage: true,
      reports_view: true, reports_synthesize: true, reports_export_pdf: true, reports_export_ppt: true,
      members_invite: false, members_role_modify: false, audit_logs_view: false, sso_configure: false
    }
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description: "Read-only access to published executive dashboards, reports, and data previews.",
    isSystem: true,
    color: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    permissions: {
      lakehouse_read: true, lakehouse_write: false, lakehouse_delete: false, query_pushdown: false,
      notebook_execute: false, model_train: false, gemini_copilot: false, api_keys_manage: false,
      reports_view: true, reports_synthesize: false, reports_export_pdf: true, reports_export_ppt: true,
      members_invite: false, members_role_modify: false, audit_logs_view: false, sso_configure: false
    }
  }
];

export function CustomRolesDesigner({
  members,
  onUpdateRoles
}: CustomRolesDesignerProps) {
  const [roles, setRoles] = useState<CustomRoleDefinition[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<CustomRoleDefinition>(INITIAL_ROLES[1]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const handleTogglePermission = (roleId: string, permKey: string) => {
    if (selectedRole.isSystem && selectedRole.name === "Owner") {
      toast.error("Owner permissions are locked for safety.");
      return;
    }

    const updated = roles.map((r) => {
      if (r.id !== roleId) return r;
      const current = !!r.permissions[permKey];
      return {
        ...r,
        permissions: { ...r.permissions, [permKey]: !current }
      };
    });

    setRoles(updated);
    const newSelected = updated.find((r) => r.id === roleId);
    if (newSelected) setSelectedRole(newSelected);
    if (onUpdateRoles) onUpdateRoles(updated);
    toast.success("Permission updated.");
  };

  const handleCloneRole = (sourceRole: CustomRoleDefinition) => {
    const cloned: CustomRoleDefinition = {
      id: `custom-role-${Date.now()}`,
      name: `${sourceRole.name} (Custom)`,
      description: `Custom fork of ${sourceRole.name} role policies.`,
      isSystem: false,
      color: "bg-violet-500/20 text-violet-300 border-violet-500/40",
      permissions: { ...sourceRole.permissions }
    };

    const updated = [...roles, cloned];
    setRoles(updated);
    setSelectedRole(cloned);
    if (onUpdateRoles) onUpdateRoles(updated);
    toast.success(`Cloned '${cloned.name}' role matrix.`);
  };

  const handleCreateCustomRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Please provide a name for the custom role.");
      return;
    }

    const newRole: CustomRoleDefinition = {
      id: `custom-role-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || "Bespoke RBAC privilege matrix.",
      isSystem: false,
      color: "bg-violet-500/20 text-violet-300 border-violet-500/40",
      permissions: {
        lakehouse_read: true,
        reports_view: true,
        reports_export_pdf: true
      }
    };

    const updated = [...roles, newRole];
    setRoles(updated);
    setSelectedRole(newRole);
    if (onUpdateRoles) onUpdateRoles(updated);
    setShowCreateModal(false);
    setNewRoleName("");
    setNewRoleDesc("");
    toast.success(`Custom role '${newRole.name}' created!`);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    const target = roles.find((r) => r.id === roleId);
    if (target?.isSystem) {
      toast.error("Cannot delete default system roles.");
      return;
    }

    const updated = roles.filter((r) => r.id !== roleId);
    setRoles(updated);
    setSelectedRole(roles[0]);
    if (onUpdateRoles) onUpdateRoles(updated);
    toast.info("Custom role removed.");
  };

  return (
    <div className="space-y-6" id="custom-roles-designer">
      {/* Header Bar */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600/30 to-purple-600/30 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Custom Roles & Granular RBAC Matrix</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {roles.length} Roles Defined
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Design custom security roles with fine-grained switches for MicroVM compute, pushdown queries, and audit access.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-8 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" /> Define Custom Role
          </Button>
        </div>
      </Card>

      {/* Main Role Editor Layout: Left List + Right Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Selector Sidebar */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Available Roles ({roles.length})
          </div>

          {roles.map((r) => {
            const isSelected = selectedRole.id === r.id;
            const assignedCount = members.filter((m) => m.role.toLowerCase() === r.name.toLowerCase()).length;

            return (
              <motion.div
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-600/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${r.color}`}>
                      {r.name}
                    </span>
                    {r.isSystem && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                        System
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {assignedCount} {assignedCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                  {r.description}
                </p>

                <div className="pt-1.5 flex items-center justify-between border-t border-slate-850 text-[10px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloneRole(r);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Fork / Clone
                  </button>

                  {!r.isSystem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomRole(r.id);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Granular Permission Matrix */}
        <div className="lg:col-span-8">
          <Card className="bg-slate-950/90 border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-white">{selectedRole.name} Privilege Matrix</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${selectedRole.color}`}>
                    {selectedRole.isSystem ? "Default System Matrix" : "Custom Scopes"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedRole.description}</p>
              </div>

              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-500/30 shrink-0">
                {Object.values(selectedRole.permissions).filter(Boolean).length} / 16 Permissions Active
              </div>
            </div>

            {/* Permission Matrix by Categories */}
            <div className="space-y-6">
              {PERMISSION_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;

                return (
                  <div key={cat.category} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <IconComponent className="h-4 w-4 text-violet-400" />
                      <span>{cat.category}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.permissions.map((perm) => {
                        const isGranted = !!selectedRole.permissions[perm.key];
                        const isLocked = selectedRole.isSystem && selectedRole.name === "Owner";

                        return (
                          <div
                            key={perm.key}
                            onClick={() => !isLocked && handleTogglePermission(selectedRole.id, perm.key)}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                              isLocked
                                ? "cursor-not-allowed opacity-90"
                                : "cursor-pointer hover:border-slate-700"
                            } ${
                              isGranted
                                ? "bg-slate-900/90 border-violet-500/40"
                                : "bg-slate-950/50 border-slate-800 text-slate-500"
                            }`}
                          >
                            <div>
                              <div className={`text-xs font-bold ${isGranted ? "text-white" : "text-slate-400"}`}>
                                {perm.label}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {perm.desc}
                              </div>
                            </div>

                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border ${
                              isGranted
                                ? "bg-violet-600 border-violet-400 text-white"
                                : "bg-slate-900 border-slate-700 text-slate-600"
                            }`}>
                              {isGranted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Define Custom Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-extrabold text-white">Define Custom RBAC Role</h4>
                <p className="text-xs text-slate-400">Create a tailored permission profile for specialized workflows.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Role Title</label>
                <Input
                  placeholder="e.g., Compliance Auditor, ML Fellow"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description & Scope</label>
                <Input
                  placeholder="Role responsibilities and privilege boundary..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="bg-slate-800 border-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCustomRole}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl"
              >
                Create Role
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
