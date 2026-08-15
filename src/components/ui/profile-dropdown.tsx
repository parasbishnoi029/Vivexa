import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Settings, CreditCard, HelpCircle, LogOut, ChevronDown, Activity, HardDrive, FolderKanban } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuthStore();
  
  const [profileData, setProfileData] = useState<{
    full_name: string;
    avatar_url: string;
    role: string;
    plan: string;
  }>({
    full_name: user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : (user?.email?.split('@')[0] || 'User'),
    avatar_url: user?.user_metadata?.avatar_url || '',
    role: 'User',
    plan: 'Free'
  });

  const [metrics, setMetrics] = useState({ projects: 0, datasets: 0, storage: 0, plan: 'free', role: 'user' });

  useEffect(() => {
    if (user) {
      async function loadProfile() {
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle();
          const { data: uData } = await supabase.from('users').select('*').eq('id', user?.id).maybeSingle();
          const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user?.id);
          const { count: dCount } = await supabase.from('datasets').select('*', { count: 'exact', head: true }).eq('user_id', user?.id);
          const { data: sData } = await supabase.from('datasets').select('size_bytes').eq('user_id', user?.id);
          
          const storage = sData?.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0) || 0;
          
          const fullName = profile?.full_name || uData?.full_name || (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : '') || user?.email?.split('@')[0] || 'User';
          const avatarUrl = profile?.avatar_url || uData?.avatar_url || user?.user_metadata?.avatar_url || '';
          const role = profile?.role || uData?.role || 'User';
          const plan = uData?.plan || profile?.plan || 'Free';

          setProfileData({
            full_name: fullName,
            avatar_url: avatarUrl,
            role,
            plan
          });

          setMetrics({
            projects: pCount || 0,
            datasets: dCount || 0,
            storage: storage / (1024 * 1024), // MB
            plan,
            role
          });
        } catch (err) {
          console.warn("Error loading profile dropdown data:", err);
        }
      }
      loadProfile();
    }
  }, [user]);

  const initials = profileData.full_name 
    ? profileData.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : (user?.email?.substring(0, 2).toUpperCase() || 'U');

  return (
    <div className="relative">
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <div className="h-full w-full rounded-[11px] bg-slate-950 flex items-center justify-center font-bold text-sm text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-colors pointer-events-none" />
            {profileData.avatar_url ? (
              <img loading="lazy" src={profileData.avatar_url} alt={profileData.full_name} className="h-full w-full object-cover relative z-10" />
            ) : (
              <span className="relative z-10">{initials}</span>
            )}
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 overflow-hidden">
                    {profileData.avatar_url ? (
                      <img loading="lazy" src={profileData.avatar_url} alt={profileData.full_name} className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{profileData.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Role: <span className="text-slate-200">{metrics.role}</span></span>
                  <span>Plan: <span className="text-indigo-400 capitalize">{metrics.plan}</span></span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> {metrics.projects}</span>
                  <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {metrics.storage.toFixed(1)} MB</span>
                </div>
              </div>
              <div className="p-2 space-y-0.5">
                <Link to="/workspace/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors">
                  <User className="h-4 w-4 text-slate-400" /> Profile
                </Link>
                <Link to="/workspace/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors">
                  <Settings className="h-4 w-4 text-slate-400" /> Settings
                </Link>
                <Link to="/workspace/billing" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors">
                  <CreditCard className="h-4 w-4 text-slate-400" /> Billing
                </Link>
                <Link to="#" onClick={(e) => { e.preventDefault(); setIsOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors">
                  <HelpCircle className="h-4 w-4 text-slate-400" /> Help
                </Link>
                <div className="h-px bg-slate-800/60 my-1 mx-2" />
                <button 
                  onClick={async () => {
                    setIsOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
