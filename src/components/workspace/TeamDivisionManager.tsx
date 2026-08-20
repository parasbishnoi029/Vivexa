import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, UserPlus, Layers, Plus, Trash2, Edit3, Shield,
  CheckCircle2, Sparkles, Sliders, Cpu, Database, FileText,
  Search, ArrowRight, UserCheck, X, Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { WorkspaceMember } from "@/pages/workspace/Organization";

export interface SquadTeam {
  id: string;
  name: string;
  department: string;
  description: string;
  leadId?: string;
  leadName?: string;
  memberIds: string[];
  color: string;
  monthlyComputeLimitHours: number;
  activeProjectsCount: number;
  created_at: string;
}

interface TeamDivisionManagerProps {
  members: WorkspaceMember[];
  workspaceName?: string;
  onUpdateSquads?: (squads: SquadTeam[]) => void;
}

const DEFAULT_SQUADS: SquadTeam[] = [
  {
    id: "squad-1",
    name: "AI & Neural Modeling Core",
    department: "Data & Analytics",
    description: "Core algorithms, Gemini pipeline integrations, time-series forecasting, and causal inference engines.",
    leadName: "Lead Data Scientist",
    memberIds: [],
    color: "from-emerald-500 to-teal-600",
    monthlyComputeLimitHours: 250,
    activeProjectsCount: 8,
    created_at: "2026-01-15"
  },
  {
    id: "squad-2",
    name: "Lakehouse & Pushdown Squad",
    department: "Engineering & Architecture",
    description: "Distributed query pushdown, Arrow streaming buffers, Parquet serialization, and multi-tenant partitioning.",
    leadName: "Principal Architect",
    memberIds: [],
    color: "from-blue-500 to-indigo-600",
    monthlyComputeLimitHours: 500,
    activeProjectsCount: 12,
    created_at: "2026-02-01"
  },
  {
    id: "squad-3",
    name: "Executive BI & Reporting Guild",
    department: "Organisational Development & Renewal",
    description: "Multi-pass executive briefings, PowerPoint deck templates, automated anomaly badging, and board packs.",
    leadName: "Director of BI",
    memberIds: [],
    color: "from-amber-500 to-orange-600",
    monthlyComputeLimitHours: 150,
    activeProjectsCount: 6,
    created_at: "2026-03-10"
  },
  {
    id: "squad-4",
    name: "Security & Governance Taskforce",
    department: "Executive & Leadership",
    description: "SOC2 compliance auditing, enterprise SSO SAML/SCIM, tamper-evident audit trails, and MNC++ policies.",
    leadName: "Chief Security Officer",
    memberIds: [],
    color: "from-violet-500 to-purple-600",
    monthlyComputeLimitHours: 100,
    activeProjectsCount: 4,
    created_at: "2026-04-05"
  }
];

export function TeamDivisionManager({
  members,
  workspaceName = "Enterprise Workspace",
  onUpdateSquads
}: TeamDivisionManagerProps) {
  const [squads, setSquads] = useState<SquadTeam[]>(() => {
    // Distribute members evenly across default squads on first load
    return DEFAULT_SQUADS.map((s, idx) => ({
      ...s,
      memberIds: members.slice(idx * 2, idx * 2 + 2).map((m) => m.id)
    }));
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<SquadTeam | null>(null);

  // New Squad Form
  const [newSquadName, setNewSquadName] = useState("");
  const [newSquadDept, setNewSquadDept] = useState("Data & Analytics");
  const [newSquadDesc, setNewSquadDesc] = useState("");
  const [newSquadLimit, setNewSquadLimit] = useState(200);

  const handleCreateSquad = () => {
    if (!newSquadName.trim()) {
      toast.error("Please provide a team or squad name.");
      return;
    }

    const newSquad: SquadTeam = {
      id: `squad-${Date.now()}`,
      name: newSquadName.trim(),
      department: newSquadDept,
      description: newSquadDesc.trim() || "Operational working group.",
      memberIds: [],
      color: "from-indigo-500 to-violet-600",
      monthlyComputeLimitHours: Number(newSquadLimit) || 150,
      activeProjectsCount: 1,
      created_at: new Date().toISOString().split("T")[0]
    };

    const updated = [newSquad, ...squads];
    setSquads(updated);
    if (onUpdateSquads) onUpdateSquads(updated);
    toast.success(`Created squad '${newSquad.name}'!`);
    setShowCreateModal(false);
    setNewSquadName("");
    setNewSquadDesc("");
  };

  const handleDeleteSquad = (squadId: string) => {
    const target = squads.find((s) => s.id === squadId);
    if (!confirm(`Are you sure you want to disband '${target?.name || "this squad"}'?`)) return;
    const updated = squads.filter((s) => s.id !== squadId);
    setSquads(updated);
    if (onUpdateSquads) onUpdateSquads(updated);
    if (selectedSquad?.id === squadId) setSelectedSquad(null);
    toast.info("Team disbanded.");
  };

  const handleToggleMemberInSquad = (squadId: string, memberId: string) => {
    const updated = squads.map((s) => {
      if (s.id !== squadId) return s;
      const exists = s.memberIds.includes(memberId);
      const newMembers = exists
        ? s.memberIds.filter((id) => id !== memberId)
        : [...s.memberIds, memberId];
      return { ...s, memberIds: newMembers };
    });
    setSquads(updated);
    if (onUpdateSquads) onUpdateSquads(updated);
    if (selectedSquad?.id === squadId) {
      setSelectedSquad(updated.find((s) => s.id === squadId) || null);
    }
  };

  const filteredSquads = squads.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" id="team-division-manager">
      {/* Header Toolbar */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Teams, Squads & Operational Divisions</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {squads.length} Active Squads
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Organize staff into agile cross-functional working groups with dedicated compute quotas and project scopes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search teams or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-950/70 border-slate-800 text-slate-200 rounded-xl"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="h-8 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Plus className="h-3.5 w-3.5" /> Create New Squad
            </Button>
          </div>
        </div>
      </Card>

      {/* Squads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSquads.map((squad) => {
          const assignedMembers = members.filter((m) => squad.memberIds.includes(m.id));

          return (
            <motion.div
              key={squad.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/90 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all"
            >
              {/* Squad Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${squad.color} flex items-center justify-center text-white font-bold shadow-md`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{squad.name}</span>
                      </h4>
                      <span className="text-[11px] font-mono text-cyan-400">{squad.department}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSquad(squad.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                    title="Disband Squad"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {squad.description}
                </p>
              </div>

              {/* Resource Quota & Stats Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Roster</span>
                  <span className="font-bold text-white">{assignedMembers.length} Members</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Compute Cap</span>
                  <span className="font-bold text-emerald-400">{squad.monthlyComputeLimitHours} hrs/mo</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Projects</span>
                  <span className="font-bold text-indigo-400">{squad.activeProjectsCount} Linked</span>
                </div>
              </div>

              {/* Assigned Members Avatars & Management */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {assignedMembers.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No members assigned</span>
                  ) : (
                    assignedMembers.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        title={`${m.full_name || m.email} (${m.role})`}
                        className="h-7 w-7 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-200"
                      >
                        {m.full_name?.charAt(0) || "U"}
                      </div>
                    ))
                  )}
                  {assignedMembers.length > 5 && (
                    <div className="h-7 w-7 rounded-full bg-slate-700 border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold text-slate-300">
                      +{assignedMembers.length - 5}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSquad(squad)}
                  className="h-7 px-2.5 bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200 text-xs rounded-xl"
                >
                  <UserPlus className="h-3 w-3 mr-1 text-cyan-400" /> Manage Roster
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Roster Assignment Modal */}
      {selectedSquad && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-extrabold text-white">Manage Roster: {selectedSquad.name}</h4>
                <p className="text-xs text-slate-400">Click staff members below to add or remove them from this squad.</p>
              </div>
              <button
                onClick={() => setSelectedSquad(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {members.map((m) => {
                const isAssigned = selectedSquad.memberIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMemberInSquad(selectedSquad.id, m.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isAssigned
                        ? "bg-cyan-950/40 border-cyan-500/40 text-white"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isAssigned ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300"
                      }`}>
                        {isAssigned ? <Check className="h-3.5 w-3.5" /> : m.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{m.full_name || m.email}</div>
                        <div className="text-[10px] text-slate-500">{m.department || "General"} • {m.role}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isAssigned ? "bg-cyan-500/20 text-cyan-300 font-bold" : "bg-slate-900 text-slate-500"
                    }`}>
                      {isAssigned ? "Assigned" : "Click to Add"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <Button
                size="sm"
                onClick={() => setSelectedSquad(null)}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Squad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-extrabold text-white">Create Operational Squad</h4>
                <p className="text-xs text-slate-400">Establish a new cross-functional team with project compute quotas.</p>
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
                <label className="text-xs font-bold text-slate-300 block mb-1">Squad / Team Name</label>
                <Input
                  placeholder="e.g., Growth Analytics Taskforce"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Parent Division</label>
                <select
                  value={newSquadDept}
                  onChange={(e) => setNewSquadDept(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl focus:outline-none"
                >
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="Engineering & Architecture">Engineering & Architecture</option>
                  <option value="Product & Strategy">Product & Strategy</option>
                  <option value="Organisational Development & Renewal">Organisational Development & Renewal</option>
                  <option value="Sales & Growth">Sales & Growth</option>
                  <option value="Operations & Finance">Operations & Finance</option>
                  <option value="Executive & Leadership">Executive & Leadership</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Purpose & Scope</label>
                <Input
                  placeholder="Brief description of mission and deliverables..."
                  value={newSquadDesc}
                  onChange={(e) => setNewSquadDesc(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Monthly Compute Cap (Hours)</label>
                <Input
                  type="number"
                  value={newSquadLimit}
                  onChange={(e) => setNewSquadLimit(Number(e.target.value))}
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
                onClick={handleCreateSquad}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Create Squad
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
