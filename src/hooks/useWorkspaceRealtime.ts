import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { toast } from "sonner";

export interface RealtimeDashboardStats {
  projects: number;
  datasets: number;
  reports: number;
  ai: number;
  storage: number;
  members: number;
  pendingInvites: number;
}

export interface RealtimeActivityItem {
  id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  user_id?: string;
  payload?: any;
  created_at: string;
}

export interface UseWorkspaceRealtimeOptions {
  enableToasts?: boolean;
  onEvent?: (table: string, eventType: string, newRecord: any, oldRecord: any) => void;
}

export function useWorkspaceRealtime(options: UseWorkspaceRealtimeOptions = {}) {
  const { user, session } = useAuthStore();
  const selectedWorkspaceId = useWorkspaceStore(state => state.selectedWorkspaceId);

  const [stats, setStats] = useState<RealtimeDashboardStats>({
    projects: 0,
    datasets: 0,
    reports: 0,
    ai: 0,
    storage: 0,
    members: 1,
    pendingInvites: 0
  });

  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentDatasets, setRecentDatasets] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RealtimeActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const isMountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  // Fetch complete workspace & dashboard metrics from database
  const fetchDashboardMetrics = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);

    try {
      let projectsQuery = supabase.from('projects').select('*');
      let projectsCountQuery = supabase.from('projects').select('*', { count: 'exact', head: true });
      let datasetsQuery = supabase.from('datasets').select('*');
      let datasetsCountQuery = supabase.from('datasets').select('*', { count: 'exact', head: true });
      let datasetsStorageQuery = supabase.from('datasets').select('size_bytes');
      let reportsCountQuery = supabase.from('reports').select('*', { count: 'exact', head: true });
      let aiConversationsQuery = supabase.from('ai_conversations').select('*', { count: 'exact', head: true });
      let membersCountQuery = supabase.from('workspace_members').select('*', { count: 'exact', head: true });
      let auditLogsQuery = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10);

      // If specific workspace is selected
      if (selectedWorkspaceId && selectedWorkspaceId !== "all") {
        projectsQuery = projectsQuery.eq('workspace_id', selectedWorkspaceId);
        projectsCountQuery = projectsCountQuery.eq('workspace_id', selectedWorkspaceId);

        const { data: workspaceProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('workspace_id', selectedWorkspaceId);
        const projectIds = workspaceProjects?.map(p => p.id) || [];

        datasetsQuery = datasetsQuery.eq('workspace_id', selectedWorkspaceId);
        datasetsCountQuery = datasetsCountQuery.eq('workspace_id', selectedWorkspaceId);
        datasetsStorageQuery = datasetsStorageQuery.eq('workspace_id', selectedWorkspaceId);

        if (projectIds.length > 0) {
          reportsCountQuery = reportsCountQuery.or(`project_id.in.(${projectIds.join(',')}),and(user_id.eq.${user.id},project_id.is.null)`);
        } else {
          reportsCountQuery = reportsCountQuery.eq('user_id', user.id).is('project_id', null);
        }
        
        aiConversationsQuery = aiConversationsQuery.eq('user_id', user.id);
        membersCountQuery = membersCountQuery.eq('workspace_id', selectedWorkspaceId);
      } else {
        projectsQuery = projectsQuery.eq('owner_id', user.id);
        projectsCountQuery = projectsCountQuery.eq('owner_id', user.id);
        datasetsQuery = datasetsQuery.eq('user_id', user.id);
        datasetsCountQuery = datasetsCountQuery.eq('user_id', user.id);
        datasetsStorageQuery = datasetsStorageQuery.eq('user_id', user.id);
        reportsCountQuery = reportsCountQuery.eq('user_id', user.id);
        aiConversationsQuery = aiConversationsQuery.eq('user_id', user.id);
      }

      // Fetch invitations count from workspace metadata or table
      let pendingInvitesCount = 0;
      try {
        if (session?.access_token) {
          const wsUrl = selectedWorkspaceId && selectedWorkspaceId !== 'all' 
            ? `/api/v1/organization/data?workspace_id=${selectedWorkspaceId}` 
            : '/api/v1/organization/data';
          const orgRes = await fetch(wsUrl, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (orgRes.ok) {
            const orgJson = await orgRes.json();
            if (orgJson.success && orgJson.data) {
              const invs = orgJson.data.invitations || [];
              pendingInvitesCount = invs.filter((i: any) => i.status === 'Pending').length;
              if (orgJson.data.members?.length) {
                // If members count from table was null, use organization endpoint member count
                setStats(prev => ({ ...prev, members: orgJson.data.members.length }));
              }
              if (orgJson.data.activity?.length) {
                setRecentActivity(orgJson.data.activity);
              }
            }
          }
        }
      } catch (e) {
        // Continue gracefully
      }

      const [
        { count: projectsCount },
        { count: datasetsCount },
        { count: reportsCount },
        { count: aiCount },
        { count: membersCount },
        { data: storageData },
        { data: recentProjs },
        { data: recentDS },
        { data: auditLogs }
      ] = await Promise.all([
        projectsCountQuery,
        datasetsCountQuery,
        reportsCountQuery,
        aiConversationsQuery,
        membersCountQuery,
        datasetsStorageQuery,
        projectsQuery.order('updated_at', { ascending: false }).limit(4),
        datasetsQuery.order('created_at', { ascending: false }).limit(4),
        auditLogsQuery
      ]);

      if (!isMountedRef.current) return;

      const storageUsed = storageData?.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0) || 0;

      setStats(prev => ({
        projects: projectsCount ?? 0,
        datasets: datasetsCount ?? 0,
        reports: reportsCount ?? 0,
        ai: aiCount ?? 0,
        storage: storageUsed / (1024 * 1024 * 1024),
        members: membersCount ? Math.max(1, membersCount) : (prev.members || 1),
        pendingInvites: pendingInvitesCount
      }));

      setRecentProjects(recentProjs || []);
      setRecentDatasets(recentDS || []);
      if (auditLogs && auditLogs.length > 0) {
        setRecentActivity(auditLogs);
      }
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("[useWorkspaceRealtime] Error loading statistics:", err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [user, session, selectedWorkspaceId]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    isMountedRef.current = true;
    if (!user) return;

    // Initial load
    fetchDashboardMetrics();

    // Unique channel identifier
    const channelId = `ws-realtime-${selectedWorkspaceId || user.id}-${Date.now()}`;
    const channel = supabase.channel(channelId);
    channelRef.current = channel;

    // Helper to handle any realtime database event
    const handleRealtimeChange = (table: string, payload: any) => {
      if (!isMountedRef.current) return;

      setEventCount(prev => prev + 1);
      setLastSyncedAt(new Date());

      // Optional user callback
      options.onEvent?.(table, payload.eventType, payload.new, payload.old);

      // Selective update / silent refetch
      if (table === 'audit_logs') {
        if (payload.eventType === 'INSERT' && payload.new) {
          setRecentActivity(prev => [payload.new, ...prev.slice(0, 9)]);
        }
      }

      if (table === 'workspace_members') {
        if (payload.eventType === 'INSERT') {
          setStats(prev => ({ ...prev, members: prev.members + 1 }));
          if (options.enableToasts) {
            toast.info("A new team member joined the workspace in real-time.");
          }
        } else if (payload.eventType === 'DELETE') {
          setStats(prev => ({ ...prev, members: Math.max(1, prev.members - 1) }));
        }
      }

      if (table === 'workspace_invitations') {
        if (payload.eventType === 'INSERT') {
          setStats(prev => ({ ...prev, pendingInvites: prev.pendingInvites + 1 }));
        } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          if (payload.new?.status !== 'Pending') {
            setStats(prev => ({ ...prev, pendingInvites: Math.max(0, prev.pendingInvites - 1) }));
          }
        }
      }

      if (table === 'projects') {
        if (payload.eventType === 'INSERT') {
          setStats(prev => ({ ...prev, projects: prev.projects + 1 }));
        } else if (payload.eventType === 'DELETE') {
          setStats(prev => ({ ...prev, projects: Math.max(0, prev.projects - 1) }));
        }
      }

      if (table === 'datasets') {
        if (payload.eventType === 'INSERT') {
          setStats(prev => ({ ...prev, datasets: prev.datasets + 1 }));
        } else if (payload.eventType === 'DELETE') {
          setStats(prev => ({ ...prev, datasets: Math.max(0, prev.datasets - 1) }));
        }
      }

      // Re-fetch in the background to ensure all calculated views stay consistent
      fetchDashboardMetrics(true);
    };

    // Subscribe to Postgres changes on core workspace tables
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_members' },
        (payload) => handleRealtimeChange('workspace_members', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        (payload) => handleRealtimeChange('workspaces', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_invitations' },
        (payload) => handleRealtimeChange('workspace_invitations', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        (payload) => handleRealtimeChange('audit_logs', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => handleRealtimeChange('projects', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'datasets' },
        (payload) => handleRealtimeChange('datasets', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => handleRealtimeChange('reports', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_conversations' },
        (payload) => handleRealtimeChange('ai_conversations', payload)
      )
      .subscribe((status) => {
        if (isMountedRef.current) {
          if (status === 'SUBSCRIBED') {
            setIsLive(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsLive(false);
          }
        }
      });

    // Heartbeat sync every 25 seconds for resilient live updates
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardMetrics(true);
      }
    }, 60000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, selectedWorkspaceId, fetchDashboardMetrics]);

  return {
    stats,
    recentProjects,
    recentDatasets,
    recentActivity,
    loading,
    isLive,
    lastSyncedAt,
    eventCount,
    refetch: () => fetchDashboardMetrics(false),
    silentRefetch: () => fetchDashboardMetrics(true)
  };
}
