import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Building2, ChevronDown, ChevronRight, User, Shield,
  Award, Mail, Search, ZoomIn, ZoomOut, Maximize2, Sparkles,
  ArrowRight, Filter, Download, Check, Layers, Briefcase, ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { WorkspaceMember } from "@/pages/workspace/Organization";

interface OrgChartVisualizerProps {
  members: WorkspaceMember[];
  workspaceName?: string;
  onEditMember?: (member: WorkspaceMember) => void;
}

interface DepartmentNode {
  name: string;
  lead?: WorkspaceMember;
  members: WorkspaceMember[];
  color: string;
  subTeams: string[];
}

const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  "Executive & Leadership": { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300", lightBg: "bg-amber-950/40" },
  "Engineering & Architecture": { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300", lightBg: "bg-blue-950/40" },
  "Data & Analytics": { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300", lightBg: "bg-emerald-950/40" },
  "Product & Strategy": { bg: "bg-violet-500/20", border: "border-violet-500/40", text: "text-violet-300", lightBg: "bg-violet-950/40" },
  "Sales & Growth": { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-300", lightBg: "bg-rose-950/40" },
  "Operations & Finance": { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-300", lightBg: "bg-cyan-950/40" },
  "Organisational Development & Renewal": { bg: "bg-indigo-500/20", border: "border-indigo-500/40", text: "text-indigo-300", lightBg: "bg-indigo-950/40" },
};

export function OrgChartVisualizer({
  members,
  workspaceName = "Enterprise Workspace",
  onEditMember
}: OrgChartVisualizerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    "Executive & Leadership": true,
    "Engineering & Architecture": true,
    "Data & Analytics": true,
    "Product & Strategy": true,
    "Sales & Growth": true,
    "Operations & Finance": true,
    "Organisational Development & Renewal": true,
  });
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);

  // Group members into department tree hierarchy
  const orgTree = useMemo(() => {
    // 1. Find root executive/owner
    const executiveMembers = members.filter(
      (m) => m.is_owner || m.role === "Owner" || m.role === "Executive" || m.department === "Executive & Leadership"
    );
    const rootExecutive = executiveMembers[0] || members[0] || {
      id: "root-lead",
      user_id: "root",
      email: "lead@enterprise.org",
      full_name: "Principal Officer",
      role: "Owner",
      department: "Executive & Leadership",
      status: "active",
      created_at: new Date().toISOString(),
      is_owner: true,
    };

    // 2. Group all other members by department
    const depts: Record<string, DepartmentNode> = {};
    const defaultDepts = [
      "Executive & Leadership",
      "Engineering & Architecture",
      "Data & Analytics",
      "Product & Strategy",
      "Sales & Growth",
      "Operations & Finance",
      "Organisational Development & Renewal"
    ];

    defaultDepts.forEach((dName) => {
      depts[dName] = {
        name: dName,
        members: [],
        color: DEPT_COLORS[dName]?.border || "border-slate-700",
        subTeams: []
      };
    });

    members.forEach((m) => {
      const deptName = m.department || "Organisational Development & Renewal";
      if (!depts[deptName]) {
        depts[deptName] = {
          name: deptName,
          members: [],
          color: "border-slate-700",
          subTeams: []
        };
      }
      depts[deptName].members.push(m);
    });

    // Determine lead for each department (Admin or Manager or first member)
    Object.keys(depts).forEach((dName) => {
      const dMembers = depts[dName].members;
      const lead = dMembers.find((m) => m.role === "Admin" || m.role === "Manager") || dMembers[0];
      depts[dName].lead = lead;
    });

    return { rootExecutive, depts };
  }, [members]);

  const toggleDept = (deptName: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(orgTree.depts).forEach((k) => (all[k] = true));
    setExpandedDepts(all);
    toast.info("Expanded all department branches.");
  };

  const handleCollapseAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(orgTree.depts).forEach((k) => (all[k] = false));
    setExpandedDepts(all);
    toast.info("Collapsed all department branches.");
  };

  const filteredDepts = useMemo(() => {
    return Object.entries(orgTree.depts).filter(([deptName, node]) => {
      if (selectedDeptFilter !== "all" && deptName !== selectedDeptFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      if (deptName.toLowerCase().includes(q)) return true;
      return node.members.some(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q)
      );
    });
  }, [orgTree, selectedDeptFilter, searchQuery]);

  return (
    <div className="space-y-6" id="org-chart-visualizer">
      {/* Controls & Filter Toolbar */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Interactive Organization Hierarchy</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {members.length} Staff Mapped
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visual reporting structure, department leads, and operational tree for <strong className="text-slate-300">{workspaceName}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search staff, role, or division..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-950/70 border-slate-800 text-slate-200 rounded-xl"
              />
            </div>

            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="h-8 px-2.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Divisions ({Object.keys(orgTree.depts).length})</option>
              {Object.keys(orgTree.depts).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExpandAll}
              className="h-8 px-2.5 bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-300 text-xs rounded-xl"
            >
              Expand All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCollapseAll}
              className="h-8 px-2.5 bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-300 text-xs rounded-xl"
            >
              Collapse
            </Button>
          </div>
        </div>
      </Card>

      {/* Visual Org Tree Render Canvas */}
      <div className="p-6 bg-slate-950/90 border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-x-auto min-h-[550px]">
        <div className="min-w-[850px] flex flex-col items-center space-y-8">
          
          {/* ROOT EXECUTIVE TIER */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/80 to-slate-900/90 border-2 border-indigo-500/60 shadow-xl shadow-indigo-600/10 text-center w-72 relative cursor-pointer hover:border-indigo-400 transition-all"
              onClick={() => setSelectedMember(orgTree.rootExecutive)}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
                <Award className="h-3 w-3" /> Executive Leadership
              </div>

              <div className="h-12 w-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 mx-auto flex items-center justify-center text-indigo-300 font-black text-lg mb-2 shadow-inner">
                {orgTree.rootExecutive.full_name?.charAt(0) || "E"}
              </div>

              <h4 className="font-extrabold text-sm text-white">{orgTree.rootExecutive.full_name || "Workspace Lead"}</h4>
              <p className="text-[11px] text-slate-400">{orgTree.rootExecutive.email}</p>
              
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {orgTree.rootExecutive.role}
                </span>
                <span className="text-slate-400">Head of Workspace</span>
              </div>
            </motion.div>

            {/* Connecting Vertical Stem */}
            <div className="h-8 w-0.5 bg-gradient-to-b from-indigo-500 to-slate-700" />
            <div className="h-0.5 w-4/5 bg-slate-700 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 h-2 w-2 rounded-full bg-indigo-500" />
            </div>
          </div>

          {/* DEPARTMENT BRANCHES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-2">
            {filteredDepts.map(([deptName, node]) => {
              const isExpanded = !!expandedDepts[deptName];
              const styling = DEPT_COLORS[deptName] || { bg: "bg-slate-800/40", border: "border-slate-700", text: "text-slate-300", lightBg: "bg-slate-900/60" };
              const memberCount = node.members.length;

              return (
                <motion.div
                  key={deptName}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border ${styling.border} ${styling.lightBg} p-4 space-y-3 transition-all flex flex-col justify-between shadow-lg`}
                >
                  {/* Department Card Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${styling.bg} border ${styling.border}`} />
                        <h4 className="text-xs font-bold text-white leading-tight">{deptName}</h4>
                      </div>

                      <button
                        onClick={() => toggleDept(deptName)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title={isExpanded ? "Collapse Branch" : "Expand Branch"}
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono mt-2 text-slate-400">
                      <span>Total Staff: <strong className="text-white">{memberCount}</strong></span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styling.bg} ${styling.text} border ${styling.border}`}>
                        {memberCount > 0 ? "Active Division" : "Pending Allocation"}
                      </span>
                    </div>
                  </div>

                  {/* Department Lead Pill */}
                  {node.lead && (
                    <div
                      onClick={() => setSelectedMember(node.lead!)}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-600 transition-colors">
                          {node.lead.full_name?.charAt(0) || "L"}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1">
                            <span>{node.lead.full_name || "Division Lead"}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">Lead</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{node.lead.role}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
                    </div>
                  )}

                  {/* Collapsible Member Roster List */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 pt-2 border-t border-slate-800/60 max-h-48 overflow-y-auto pr-1"
                    >
                      {node.members.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-2 text-center">
                          No personnel assigned to this department yet.
                        </div>
                      ) : (
                        node.members.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMember(m)}
                            className="p-2 rounded-lg bg-slate-950/40 hover:bg-slate-900 border border-slate-850 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className="h-5 w-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                                {m.full_name?.charAt(0) || "U"}
                              </div>
                              <span className="text-slate-300 truncate font-medium">{m.full_name || m.email}</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                              {m.role}
                            </span>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Selected Member Detail Modal / Drawer */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                  {selectedMember.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">{selectedMember.full_name || "Staff Member"}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {selectedMember.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Role Permission</span>
                <span className="font-bold text-indigo-400">{selectedMember.role}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Division</span>
                <span className="font-bold text-slate-200">{selectedMember.department || "General"}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Status</span>
                <span className="font-bold text-emerald-400 uppercase">{selectedMember.status}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Member Since</span>
                <span className="text-slate-300">{new Date(selectedMember.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(null)}
                className="bg-slate-800 border-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Close
              </Button>
              {onEditMember && (
                <Button
                  size="sm"
                  onClick={() => {
                    const m = selectedMember;
                    setSelectedMember(null);
                    onEditMember(m);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Edit Role & Division
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
