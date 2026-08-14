import { useState, useEffect } from "react";
import { 
  Mail, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, Server, ChevronRight, X, BarChart3, Database, Eye,
  Play, Check, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface EmailLog {
  id: string;
  recipient: string;
  subject?: string;
  template: string;
  status: 'sent' | 'failed' | 'queued' | 'delivered';
  provider: string;
  error_message?: string;
  response_metadata?: any;
  created_at: string;
}

export default function EmailDashboard() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [activeLogDetails, setActiveLogDetails] = useState<EmailLog | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    queued: 0,
    deliveryRate: 100,
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const emailLogs = (data || []) as EmailLog[];
      setLogs(emailLogs);

      // Compute statistics
      const total = emailLogs.length;
      const success = emailLogs.filter(l => l.status === "sent" || l.status === "delivered").length;
      const failed = emailLogs.filter(l => l.status === "failed").length;
      const queued = emailLogs.filter(l => l.status === "queued").length;
      const deliveryRate = total > 0 ? Math.round((success / total) * 100) : 100;

      setStats({ total, success, failed, queued, deliveryRate });
    } catch (err: any) {
      console.warn("[EMAIL DASHBOARD] Fetch failed or email_logs table empty:", err.message);
      setLogs([]);
      setStats({ total: 0, success: 0, failed: 0, queued: 0, deliveryRate: 100 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleResend = async (log: EmailLog) => {
    setIsRetrying(log.id);
    const toastId = toast.loading(`Re-dispatching email to ${log.recipient}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const bearerToken = session?.access_token || "";

      const response = await fetch(`/api/v1/notifications/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": bearerToken ? `Bearer ${bearerToken}` : "",
        },
        body: JSON.stringify({
          recipient: log.recipient,
          title: log.subject,
          message: `This is a re-dispatched system notification regarding template: ${log.template}.`,
          action_url: log.response_metadata?.action_url || ""
        }),
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        toast.success(`Email successfully re-delivered!`, { id: toastId });
        fetchLogs();
      } else {
        toast.error(resJson.error || resJson.meta?.error || "Failed to deliver email", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Delivery failed", { id: toastId });
    } finally {
      setIsRetrying(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.template.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesProvider = providerFilter === "all" || log.provider.toLowerCase() === providerFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesProvider;
  });

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Mail className="h-8 w-8 text-indigo-400" />
            Email Queue & Dispatch Center
          </h1>
          <p className="text-slate-400 mt-1 text-sm max-w-2xl">
            Real-time audit telemetry for enterprise notifications, transaction receipts, workspace invitations, and password reset dispatches.
          </p>
        </div>
        <Button 
          onClick={fetchLogs} 
          disabled={isLoading}
          variant="outline"
          className="border-slate-800 hover:bg-slate-800 text-slate-300 self-start"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </Button>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Queue Load</div>
            <div className="text-2xl font-extrabold text-white">{stats.total}</div>
            <div className="text-[9px] text-slate-400 mt-1">Dispatched emails</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Delivered Successfully</div>
            <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              {stats.success}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Provider confirmed</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Failed Dispatches</div>
            <div className="text-2xl font-extrabold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              {stats.failed}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Auto-logged rollback records</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Queued / Active</div>
            <div className="text-2xl font-extrabold text-blue-400 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400 animate-pulse" />
              {stats.queued}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Pending retry/throttle</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Delivery Success Rate</div>
            <div className="text-2xl font-extrabold text-indigo-400">{stats.deliveryRate}%</div>
            <div className="text-[9px] text-slate-400 mt-1">Targeting &gt;99% SLA</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card className="bg-slate-900/30 border-slate-800/60 backdrop-blur-2xl">
        <CardHeader className="border-b border-slate-800/60 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400" />
                Audit Logs Table
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Inspect every outgoing transaction link, recipient address, and mail delivery response state.
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search recipient, template..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="queued">Queued</option>
              </select>

              <select 
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Providers</option>
                <option value="resend">Resend</option>
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
                <option value="ses">Amazon SES</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col h-64 items-center justify-center gap-2">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400">Loading dispatcher logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-center p-6">
              <Mail className="h-12 w-12 text-slate-600 mb-3 opacity-40" />
              <h3 className="text-lg font-bold text-slate-300">No logs found</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                There are no matches for the active filters. Ensure that the email delivery backend has dispatched notifications.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/30 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Template</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 font-semibold text-slate-200">{log.recipient}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-300">
                        <span className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                          {log.template}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">{log.subject}</td>
                      <td className="p-4 uppercase font-mono font-bold text-[10px] text-indigo-300">{log.provider}</td>
                      <td className="p-4">
                        {log.status === "sent" || log.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="h-3 w-3" /> Sent
                          </span>
                        ) : log.status === "failed" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle className="h-3 w-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Clock className="h-3 w-3 animate-pulse" /> Queued
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-1.5">
                        <Button 
                          onClick={() => setActiveLogDetails(log)}
                          variant="ghost" 
                          size="icon"
                          title="View Details"
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleResend(log)}
                          disabled={isRetrying === log.id}
                          variant="ghost" 
                          size="icon"
                          title="Resend / Re-deliver"
                          className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                        >
                          {isRetrying === log.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <AnimatePresence>
        {activeLogDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Log Telemetry Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {activeLogDetails.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveLogDetails(null)} 
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-sm">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Recipient</div>
                    <div className="text-white font-medium">{activeLogDetails.recipient}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Provider Routing</div>
                    <div className="text-indigo-400 font-mono font-bold uppercase">{activeLogDetails.provider}</div>
                  </div>
                  <div className="col-span-2 border-t border-slate-800/40 pt-3 mt-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Email Subject</div>
                    <div className="text-white font-medium">{activeLogDetails.subject}</div>
                  </div>
                </div>

                {/* Error Banner */}
                {activeLogDetails.status === "failed" && activeLogDetails.error_message && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-red-400">Dispatch Failure Logged</h4>
                      <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                        {activeLogDetails.error_message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Response Metadata */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payload & Response JSON</h4>
                  <pre className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-x-auto text-[11px] font-mono text-indigo-300 leading-relaxed max-h-60">
                    {JSON.stringify(activeLogDetails.response_metadata || { message: "No supplementary metadata recorded" }, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800/60 bg-slate-950/20 flex justify-end gap-3">
                <Button 
                  onClick={() => setActiveLogDetails(null)} 
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                >
                  Close Inspection
                </Button>
                <Button 
                  onClick={() => {
                    handleResend(activeLogDetails);
                    setActiveLogDetails(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Trigger Redelivery
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
