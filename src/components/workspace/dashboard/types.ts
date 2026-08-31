export type DashboardViewMode = 'executive' | 'analytics' | 'operations' | 'all';

export interface DashboardDisplayPreferences {
  density: 'comfortable' | 'compact';
  showSparklines: boolean;
  showQuickPrompts: boolean;
  showInsightsCard: boolean;
  showTelemetryChart: boolean;
  showAnomalyFeed: boolean;
  showRecentProjects: boolean;
  showRecentDatasets: boolean;
  showPlatformShortcuts: boolean;
  showSystemLogs: boolean;
}

export const DEFAULT_DISPLAY_PREFERENCES: DashboardDisplayPreferences = {
  density: 'comfortable',
  showSparklines: true,
  showQuickPrompts: true,
  showInsightsCard: true,
  showTelemetryChart: true,
  showAnomalyFeed: true,
  showRecentProjects: true,
  showRecentDatasets: true,
  showPlatformShortcuts: true,
  showSystemLogs: true,
};
