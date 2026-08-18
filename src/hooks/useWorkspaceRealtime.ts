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
  totalRows: number;
  totalCols: number;
  avgQuality: number;
  notebooks: number;
  totalSizeBytes: number;
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
    pendingInvites: 0,
    totalRows: 0,
    totalCols: 0,
    avgQuality: 98.4,
    notebooks: 0,
    totalSizeBytes: 0
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
      let reportsCountQuery = supabase.from('reports').select('*', { count: 'exact', head: true });
      let aiConversationsQuery = supabase.from('ai_conversations').select('*', { count: 'exact', head: true });
      let membersCountQuery = supabase.from('workspace_members').select('*', { count: 'exact', head: true });
      let auditLogsQuery = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(15);

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
        { data: allDatasetsData },
        { data: recentProjs },
        { data: auditLogs }
      ] = await Promise.all([
        projectsCountQuery,
        datasetsCountQuery,
        reportsCountQuery,
        aiConversationsQuery,
        membersCountQuery,
        datasetsQuery.order('created_at', { ascending: false }),
        projectsQuery.order('updated_at', { ascending: false }).limit(6),
        auditLogsQuery
      ]);

      if (!isMountedRef.current) return;

      const datasetsList = allDatasetsData || [];
      
      // Calculate real statistical aggregations across datasets
      let totalRows = 0;
      let totalCols = 0;
      let totalSizeBytes = 0;
      let qualitySum = 0;
      let qualityCount = 0;

      datasetsList.forEach((ds: any) => {
        const rows = Number(ds.row_count || ds.rows || ds.metadata?.row_count || 0);
        const cols = Number(ds.column_count || ds.cols || ds.metadata?.column_count || 0);
        const size = Number(ds.size_bytes || ds.metadata?.file_size || 0);
        const quality = Number(ds.quality || ds.data_quality_score || ds.metadata?.data_quality_score || 0);

        totalRows += rows;
        totalCols = Math.max(totalCols, cols);
        totalSizeBytes += size;
        if (quality > 0) {
          qualitySum += quality;
          qualityCount++;
        }
      });

      const avgQuality = qualityCount > 0 ? Number((qualitySum / qualityCount).toFixed(1)) : 98.4;
      const storageGB = totalSizeBytes > 0 ? totalSizeBytes / (1024 * 1024 * 1024) : 0;

      // Also account for local storage saved executive reports if any
      let localReportsCount = 0;
      try {
        const savedLocal = localStorage.getItem("saved_executive_reports");
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed)) localReportsCount = parsed.length;
        }
      } catch (e) {
        // Ignore
      }

      // Also account for saved notebooks
      let notebooksCount = 0;
      try {
        const wsStorage = localStorage.getItem("vivexa-workspace-storage");
        if (wsStorage) {
          const parsed = JSON.parse(wsStorage);
          if (parsed?.state?.notebooks && Array.isArray(parsed.state.notebooks)) {
            notebooksCount = parsed.state.notebooks.length;
          }
        }
      } catch (e) {
        // Ignore
      }

      const totalReports = Math.max(reportsCount ?? 0, localReportsCount);

      setStats(prev => ({
        projects: projectsCount ?? 0,
        datasets: datasetsCount ?? (datasetsList.length || 0),
        reports: totalReports,
        ai: aiCount ?? 0,
        storage: Number(storageGB.toFixed(3)),
        totalSizeBytes,
        totalRows,
        totalCols,
        avgQuality,
        notebooks: notebooksCount,
        members: membersCount ? Math.max(1, membersCount) : (prev.members || 1),
        pendingInvites: pendingInvitesCount
      }));

      setRecentProjects(recentProjs || []);
      setRecentDatasets(datasetsList.slice(0, 8));
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

    // Heartbeat sync and local event listeners for resilient live updates
    const handleLocalUpdate = () => {
      fetchDashboardMetrics(true);
    };

    window.addEventListener('vivexa_data_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('focus', handleLocalUpdate);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardMetrics(true);
      }
    }, 20000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener('vivexa_data_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('focus', handleLocalUpdate);
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
