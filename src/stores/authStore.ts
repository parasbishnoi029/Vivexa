import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncUserAndWorkspace } from '@/lib/syncUser';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  initialize: () => void;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: (user) => {
    set({ user });
    if (user) syncUserAndWorkspace(user);
  },
  setSession: (session) => set({ session }),
  initialize: () => {
    // Check if demo mode is active
    if (localStorage.getItem('vivexa_demo_mode') === 'true') {
      const demoUser = {
        id: 'demo-user-id-12345',
        email: 'enterprise.demo@vivexa.ai',
        user_metadata: { first_name: 'Enterprise', last_name: 'Admin', company: 'Vivexa Enterprise' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any;
      const demoSession = {
        access_token: 'demo-token-12345',
        refresh_token: 'demo-refresh-12345',
        expires_in: 3600,
        token_type: 'bearer',
        user: demoUser
      } as any;
      set({ session: demoSession, user: demoUser, isLoading: false });
      syncUserAndWorkspace(demoUser);
      return;
    }

    // Fallback safety timeout so app never gets stuck loading if Supabase auth hangs or is blocked
    const authTimeout = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        set({ isLoading: false });
      }
    }, 1500);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(authTimeout);
        set({ session, user: session?.user || null, isLoading: false });
        if (session?.user) {
          syncUserAndWorkspace(session.user);
        }
      })
      .catch((err) => {
        clearTimeout(authTimeout);
        console.warn("Supabase auth session check note:", err);
        set({ session: null, user: null, isLoading: false });
      });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user || null, isLoading: false });
      if (event === 'PASSWORD_RECOVERY') {
        if (window.location.pathname !== '/reset-password') {
          window.location.href = '/reset-password';
        }
      }
      if (session?.user) {
        syncUserAndWorkspace(session.user);
      }
    });
  },
  signOut: async () => {
    localStorage.removeItem('vivexa_demo_mode');
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
  loginAsDemo: () => {
    const demoUser = {
      id: 'demo-user-id-12345',
      email: 'enterprise.demo@vivexa.ai',
      user_metadata: { first_name: 'Enterprise', last_name: 'Admin', company: 'Vivexa Enterprise' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as any;
    const demoSession = {
      access_token: 'demo-token-12345',
      refresh_token: 'demo-refresh-12345',
      expires_in: 3600,
      token_type: 'bearer',
      user: demoUser
    } as any;
    localStorage.setItem('vivexa_demo_mode', 'true');
    set({ user: demoUser, session: demoSession, isLoading: false });
    syncUserAndWorkspace(demoUser);
  },
}));

