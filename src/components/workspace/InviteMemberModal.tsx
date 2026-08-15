import { useState } from 'react';
import { X, Mail, Shield, Loader2, Send, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sendWorkspaceInvitation } from '@/lib/invitations';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({ isOpen, onClose, workspaceId, onSuccess }: InviteMemberModalProps) {
  const { user } = useAuthStore();
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const activeWorkspaceId = workspaceId || selectedWorkspaceId || '';

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Analyst');
  const [department, setDepartment] = useState('Organisational Development & Renewal');
  const [isSending, setIsSending] = useState(false);
  const [invitedSuccess, setInvitedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to send an invitation');
      return;
    }

    setIsSending(true);
    try {
      await sendWorkspaceInvitation({
        workspaceId: activeWorkspaceId,
        email,
        role,
        department,
        invitedByUserId: user.id
      });

      setInvitedSuccess(true);
      toast.success(`Invitation dispatched to ${email}`);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setInvitedSuccess(false);
        setEmail('');
        setErrorMessage(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      const msg = err.message || 'Failed to dispatch workspace invitation';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Invite & Onboard Talent</h2>
            <p className="text-xs text-slate-400">Grant workspace access and assign RBAC role permissions.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {invitedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">Invitation Dispatched!</h3>
            <p className="text-xs text-slate-400">
              An invitation token and onboarding instructions have been dispatched to <span className="text-indigo-300 font-semibold">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address</label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white pl-9 text-xs"
                  required
                />
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Workspace Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <Shield className="h-4 w-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Department</label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Organisational Development & Renewal">Org Development</option>
                    <option value="Engineering & Architecture">Engineering</option>
                    <option value="Product & Analytics">Product</option>
                    <option value="Executive & Strategy">Executive</option>
                    <option value="Finance & Growth">Finance</option>
                    <option value="Operations & Security">Operations</option>
                  </select>
                  <Building2 className="h-4 w-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 leading-relaxed">
              <strong>Onboarding Verification:</strong> Upon registration, talent will automatically be associated with your organization and granted secure access according to Row Level Security policies.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSending} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Send Invitation
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
