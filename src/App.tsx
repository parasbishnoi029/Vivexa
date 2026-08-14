/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect } from "react";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuthStore } from "./stores/authStore";

// Core layouts
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import AdminLayout from "./layouts/AdminLayout";

// Helper for resilient lazy imports
function lazyWithRetry<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = JSON.parse(
      window.sessionStorage.getItem('page_reloaded_for_chunk_error') || 'false'
    );

    try {
      const component = await factory();
      window.sessionStorage.setItem('page_reloaded_for_chunk_error', 'false');
      return component;
    } catch (error: any) {
      if (!pageHasAlreadyBeenReloaded) {
        window.sessionStorage.setItem('page_reloaded_for_chunk_error', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Lazy-loaded pages
const LandingPage = lazyWithRetry(() => import("./pages/Landing"));
const FoundersPage = lazyWithRetry(() => import("./pages/public/FoundersPage"));
const AboutPage = lazyWithRetry(() => import("./pages/public/AboutPage"));
const PlatformPage = lazyWithRetry(() => import("./pages/public/PlatformPage"));
const SolutionsPage = lazyWithRetry(() => import("./pages/public/SolutionsPage"));
const EnterprisePage = lazyWithRetry(() => import("./pages/public/EnterprisePage"));
const ResourcesPage = lazyWithRetry(() => import("./pages/public/ResourcesPage"));
const PricingPage = lazyWithRetry(() => import("./pages/public/PricingPage"));
const ProductTourPage = lazyWithRetry(() => import("./pages/public/ProductTourPage"));
const BookDemoPage = lazyWithRetry(() => import("./pages/public/BookDemoPage"));
const TermsPage = lazyWithRetry(() => import("./pages/public/TermsPage"));
const PrivacyPage = lazyWithRetry(() => import("./pages/public/PrivacyPage"));

const Login = lazyWithRetry(() => import("./pages/auth/Login"));
const Register = lazyWithRetry(() => import("./pages/auth/Register"));
const ForgotPassword = lazyWithRetry(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/auth/ResetPassword"));
const WorkspaceDashboard = lazyWithRetry(() => import("./pages/workspace/Dashboard"));
const WorkspaceProjects = lazyWithRetry(() => import("./pages/workspace/Projects"));
const WorkspaceProjectDetail = lazyWithRetry(() => import("./pages/workspace/ProjectDetail"));
const WorkspaceSettings = lazyWithRetry(() => import("./pages/workspace/Settings"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazyWithRetry(() => import("./pages/admin/Users"));
const AdminPlans = lazyWithRetry(() => import("./pages/admin/Plans"));
const AdminFeatures = lazyWithRetry(() => import("./pages/admin/Features"));
const AdminAuditLogs = lazyWithRetry(() => import("./pages/admin/AuditLogs"));
const AdminSystem = lazyWithRetry(() => import("./pages/admin/System"));
const AdminDatasets = lazyWithRetry(() => import("./pages/admin/Datasets"));
const AdminProjects = lazyWithRetry(() => import("./pages/admin/Projects"));
const AdminRoles = lazyWithRetry(() => import("./pages/admin/Roles"));
const AdminDiagnosticsConsole = lazyWithRetry(() => import("./pages/admin/DiagnosticsConsole"));
const AdminEmails = lazyWithRetry(() => import("./pages/admin/EmailDashboard"));

const WorkspaceDatasets = lazyWithRetry(() => import("./pages/workspace/Datasets"));
const WorkspaceNotifications = lazyWithRetry(() => import("./pages/workspace/Notifications"));
const WorkspaceActivity = lazyWithRetry(() => import("./pages/workspace/Activity"));
const WorkspaceChangelog = lazyWithRetry(() => import("./pages/workspace/Changelog"));
const AdminInfrastructure = lazyWithRetry(() => import("./pages/admin/Infrastructure"));
const AdminSecurityLogs = lazyWithRetry(() => import("./pages/admin/SecurityLogs"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const WorkspaceDatasetDetail = lazyWithRetry(() => import("./pages/workspace/DatasetDetail"));
const AIAnalyst = lazyWithRetry(() => import("./pages/workspace/AIAnalyst"));
const AIChat = lazyWithRetry(() => import("./pages/workspace/AIChat"));
const Predictions = lazyWithRetry(() => import("./pages/workspace/Predictions"));
const Forecasting = lazyWithRetry(() => import("./pages/workspace/Forecasting"));
const Recommendations = lazyWithRetry(() => import("./pages/workspace/Recommendations"));
const ExecutiveReports = lazyWithRetry(() => import("./pages/workspace/ExecutiveReports"));
const SavedModels = lazyWithRetry(() => import("./pages/workspace/SavedModels"));
const ProjectMemory = lazyWithRetry(() => import("./pages/workspace/ProjectMemory"));
const Organization = lazyWithRetry(() => import("./pages/workspace/Organization"));
const Billing = lazyWithRetry(() => import("./pages/workspace/Billing"));
const APIKeys = lazyWithRetry(() => import("./pages/workspace/APIKeys"));
const GlobalSearch = lazyWithRetry(() => import("./pages/workspace/GlobalSearch"));
const AIAgents = lazyWithRetry(() => import("./pages/workspace/AIAgents"));
const DataConnectors = lazyWithRetry(() => import("./pages/workspace/DataConnectors"));
const Notebooks = lazyWithRetry(() => import("./pages/workspace/Notebooks"));
const Automations = lazyWithRetry(() => import("./pages/workspace/Automations"));
const Lakehouse = lazyWithRetry(() => import("./pages/workspace/Lakehouse"));
const SemanticLayer = lazyWithRetry(() => import("./pages/workspace/SemanticLayer"));
const Marketplace = lazyWithRetry(() => import("./pages/workspace/Marketplace"));
const Ontology = lazyWithRetry(() => import("./pages/workspace/Ontology"));
const SearchAnalytics = lazyWithRetry(() => import("./pages/workspace/SearchAnalytics"));
const Plugins = lazyWithRetry(() => import("./pages/workspace/Plugins"));
const Observability = lazyWithRetry(() => import("./pages/workspace/Observability"));
const UserManual = lazyWithRetry(() => import("./pages/workspace/UserManual"));
const HelpCenter = lazyWithRetry(() => import("./pages/workspace/HelpCenter"));
const DeveloperSDK = lazyWithRetry(() => import("./pages/workspace/DeveloperSDK"));
const DecisionIntelligence = lazyWithRetry(() => import("./pages/workspace/DecisionIntelligence"));

// Reusable high-fidelity skeleton screen loaders
const PublicPageLoader = () => (
  <div className="w-full min-h-[85vh] flex flex-col justify-center items-center py-20 px-4 space-y-12 animate-pulse">
    {/* Eyebrow */}
    <Skeleton className="h-4 w-32 bg-slate-800/25 dark:bg-slate-800/50 rounded-full" />
    
    {/* Hero Header */}
    <div className="space-y-4 text-center max-w-3xl w-full flex flex-col items-center">
      <Skeleton className="h-10 md:h-12 w-11/12 bg-slate-800/40 dark:bg-slate-800/60" />
      <Skeleton className="h-10 md:h-12 w-2/3 bg-slate-800/40 dark:bg-slate-800/60" />
      <div className="pt-4 space-y-2.5 w-full flex flex-col items-center">
        <Skeleton className="h-4.5 w-3/4 bg-slate-800/20 dark:bg-slate-800/40" />
        <Skeleton className="h-4.5 w-1/2 bg-slate-800/20 dark:bg-slate-800/40" />
      </div>
    </div>

    {/* CTA Actions */}
    <div className="flex gap-4">
      <Skeleton className="h-11 w-36 rounded-xl bg-slate-800/40 dark:bg-slate-800/65" />
      <Skeleton className="h-11 w-36 rounded-xl bg-slate-800/15 dark:bg-slate-800/30" />
    </div>

    {/* Visual Card Feature */}
    <div className="w-full max-w-5xl aspect-[16/9] border border-slate-800/15 dark:border-slate-800/30 rounded-2xl p-4 bg-slate-900/5 dark:bg-slate-900/15">
      <div className="h-full w-full rounded-xl bg-slate-800/10 dark:bg-slate-800/25 flex flex-col justify-between p-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-slate-800/30" />
            <div className="h-3 w-3 rounded-full bg-slate-800/30" />
            <div className="h-3 w-3 rounded-full bg-slate-800/30" />
          </div>
          <Skeleton className="h-6 w-24 bg-slate-800/25 dark:bg-slate-800/45" />
        </div>
        <div className="space-y-4 w-2/3">
          <Skeleton className="h-8 w-1/2 bg-slate-800/25 dark:bg-slate-800/45" />
          <Skeleton className="h-4 w-full bg-slate-800/15 dark:bg-slate-800/35" />
          <Skeleton className="h-4 w-5/6 bg-slate-800/15 dark:bg-slate-800/35" />
        </div>
      </div>
    </div>
  </div>
);

const WorkspacePageLoader = () => (
  <div className="w-full space-y-8 animate-pulse p-1 md:p-2">
    {/* Page Header */}
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-4 w-28 bg-slate-800/20 dark:bg-slate-800/45" />
      <Skeleton className="h-8 w-56 bg-slate-800/40 dark:bg-slate-700/50" />
      <Skeleton className="h-4 w-96 max-w-full bg-slate-800/15 dark:bg-slate-800/35" />
    </div>

    {/* Analytics Metric Cards Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-slate-800/10 dark:border-slate-800/25 rounded-2xl p-5 space-y-4 bg-slate-900/5 dark:bg-slate-900/10">
          <Skeleton className="h-3 w-20 bg-slate-800/25 dark:bg-slate-800/45" />
          <Skeleton className="h-8 w-28 bg-slate-800/40 dark:bg-slate-800/60" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-10 bg-slate-800/15 dark:bg-slate-800/35" />
            <Skeleton className="h-3 w-24 bg-slate-800/15 dark:bg-slate-800/35" />
          </div>
        </div>
      ))}
    </div>

    {/* Content Area Split Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary High-Density Table / List Area */}
      <div className="lg:col-span-2 border border-slate-800/10 dark:border-slate-800/25 rounded-2xl p-6 space-y-6 bg-slate-900/5 dark:bg-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-800/10 dark:border-slate-800/20 pb-5">
          <div className="space-y-2">
            <Skeleton className="h-4.5 w-40 bg-slate-800/30 dark:bg-slate-800/50" />
            <Skeleton className="h-3 w-64 max-w-full bg-slate-800/15 dark:bg-slate-800/35" />
          </div>
          <Skeleton className="h-8.5 w-28 rounded-xl bg-slate-800/25 dark:bg-slate-800/45" />
        </div>
        
        {/* Table Rows */}
        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/5 dark:border-slate-800/10 last:border-0 pb-3 last:pb-0">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl bg-slate-800/25 dark:bg-slate-800/45" />
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-36 bg-slate-800/30 dark:bg-slate-800/50" />
                  <Skeleton className="h-2.5 w-24 bg-slate-800/15 dark:bg-slate-800/35" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Skeleton className="h-3 w-16 bg-slate-800/20 dark:bg-slate-800/40" />
                <Skeleton className="h-6 w-20 rounded-lg bg-slate-800/15 dark:bg-slate-800/35" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Insights & Context sidebar */}
      <div className="border border-slate-800/10 dark:border-slate-800/25 rounded-2xl p-6 space-y-6 bg-slate-900/5 dark:bg-slate-900/10">
        <div className="space-y-2 pb-4 border-b border-slate-800/10 dark:border-slate-800/20">
          <Skeleton className="h-4.5 w-32 bg-slate-800/30 dark:bg-slate-800/50" />
          <Skeleton className="h-3 w-48 bg-slate-800/15 dark:bg-slate-800/35" />
        </div>
        
        {/* Action Blocks */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-slate-800/5 dark:border-slate-800/15 rounded-xl space-y-3 bg-slate-900/5 dark:bg-slate-900/5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-4 rounded-full bg-slate-800/25 dark:bg-slate-800/45" />
                <Skeleton className="h-3 w-28 bg-slate-800/30 dark:bg-slate-800/45" />
              </div>
              <Skeleton className="h-2.5 w-full bg-slate-800/15 dark:bg-slate-800/35" />
              <Skeleton className="h-2.5 w-11/12 bg-slate-800/15 dark:bg-slate-800/35" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Reusable dynamic layout loader
const PageLoader = () => {
  const isWorkspaceOrAdmin = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/workspace') || window.location.pathname.startsWith('/admin'));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
      {isWorkspaceOrAdmin ? <WorkspacePageLoader /> : <PublicPageLoader />}
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>,
  },
  {
    path: "/founders",
    element: <Suspense fallback={<PageLoader />}><FoundersPage /></Suspense>,
  },
  {
    path: "/about",
    element: <Suspense fallback={<PageLoader />}><AboutPage /></Suspense>,
  },
  {
    path: "/platform",
    element: <Suspense fallback={<PageLoader />}><PlatformPage /></Suspense>,
  },
  {
    path: "/solutions",
    element: <Suspense fallback={<PageLoader />}><SolutionsPage /></Suspense>,
  },
  {
    path: "/enterprise",
    element: <Suspense fallback={<PageLoader />}><EnterprisePage /></Suspense>,
  },
  {
    path: "/resources",
    element: <Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense>,
  },
  {
    path: "/docs",
    element: <Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense>,
  },
  {
    path: "/pricing",
    element: <Suspense fallback={<PageLoader />}><PricingPage /></Suspense>,
  },
  {
    path: "/product-tour",
    element: <Suspense fallback={<PageLoader />}><ProductTourPage /></Suspense>,
  },
  {
    path: "/book-demo",
    element: <Suspense fallback={<PageLoader />}><BookDemoPage /></Suspense>,
  },
  {
    path: "/terms",
    element: <Suspense fallback={<PageLoader />}><TermsPage /></Suspense>,
  },
  {
    path: "/privacy",
    element: <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>,
  },
  {
    path: "/login",
    element: <Suspense fallback={<PageLoader />}><Login /></Suspense>,
  },
  {
    path: "/register",
    element: <Suspense fallback={<PageLoader />}><Register /></Suspense>,
  },
  {
    path: "/forgot-password",
    element: <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>,
  },
  {
    path: "/reset-password",
    element: <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>,
  },
  {
    path: "/workspace",
    element: <ProtectedRoute><WorkspaceLayout /></ProtectedRoute>,
    errorElement: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
    children: [
      {
        path: "",
        element: <Suspense fallback={<PageLoader />}><WorkspaceDashboard /></Suspense>,
      },
      {
        path: "projects",
        element: <Suspense fallback={<PageLoader />}><WorkspaceProjects /></Suspense>,
      },
      {
        path: "projects/:id",
        element: <Suspense fallback={<PageLoader />}><WorkspaceProjectDetail /></Suspense>,
      },
      {
        path: "data-studio",
        element: <Suspense fallback={<PageLoader />}><WorkspaceDatasets /></Suspense>,
      },
      {
        path: "datasets",
        element: <Suspense fallback={<PageLoader />}><WorkspaceDatasets /></Suspense>,
      },
      {
        path: "datasets/:id",
        element: <Suspense fallback={<PageLoader />}><WorkspaceDatasetDetail /></Suspense>,
      },
      {
        path: "ai",
        element: <Suspense fallback={<PageLoader />}><AIAnalyst /></Suspense>,
      },
      {
        path: "decision-engine",
        element: <Suspense fallback={<PageLoader />}><DecisionIntelligence /></Suspense>,
      },
      {
        path: "ai/chat",
        element: <Suspense fallback={<PageLoader />}><AIChat /></Suspense>,
      },
      {
        path: "predictions",
        element: <Suspense fallback={<PageLoader />}><Predictions /></Suspense>,
      },
      {
        path: "forecasting",
        element: <Suspense fallback={<PageLoader />}><Forecasting /></Suspense>,
      },
      {
        path: "recommendations",
        element: <Suspense fallback={<PageLoader />}><Recommendations /></Suspense>,
      },
      {
        path: "reports",
        element: <Suspense fallback={<PageLoader />}><ExecutiveReports /></Suspense>,
      },
      {
        path: "lakehouse",
        element: <Suspense fallback={<PageLoader />}><Lakehouse /></Suspense>,
      },
      {
        path: "semantic",
        element: <Suspense fallback={<PageLoader />}><SemanticLayer /></Suspense>,
      },
      {
        path: "ontology",
        element: <Suspense fallback={<PageLoader />}><Ontology /></Suspense>,
      },
      {
        path: "marketplace",
        element: <Suspense fallback={<PageLoader />}><Marketplace /></Suspense>,
      },
      {
        path: "search",
        element: <Suspense fallback={<PageLoader />}><SearchAnalytics /></Suspense>,
      },
      {
        path: "models",
        element: <Suspense fallback={<PageLoader />}><SavedModels /></Suspense>,
      },
      {
        path: "memory",
        element: <Suspense fallback={<PageLoader />}><ProjectMemory /></Suspense>,
      },
      {
        path: "organization",
        element: <Suspense fallback={<PageLoader />}><Organization /></Suspense>,
      },
      {
        path: "billing",
        element: <Suspense fallback={<PageLoader />}><Billing /></Suspense>,
      },
      {
        path: "apikeys",
        element: <Suspense fallback={<PageLoader />}><APIKeys /></Suspense>,
      },
      {
        path: "global-search",
        element: <Suspense fallback={<PageLoader />}><GlobalSearch /></Suspense>,
      },
      {
        path: "agents",
        element: <Suspense fallback={<PageLoader />}><AIAgents /></Suspense>,
      },
      {
        path: "connectors",
        element: <Suspense fallback={<PageLoader />}><DataConnectors /></Suspense>,
      },
      {
        path: "notebooks",
        element: <Suspense fallback={<PageLoader />}><Notebooks /></Suspense>,
      },
      {
        path: "automations",
        element: <Suspense fallback={<PageLoader />}><Automations /></Suspense>,
      },
      {
        path: "plugins",
        element: <Suspense fallback={<PageLoader />}><Plugins /></Suspense>,
      },
      {
        path: "observability",
        element: <Suspense fallback={<PageLoader />}><Observability /></Suspense>,
      },
      {
        path: "settings",
        element: <Suspense fallback={<PageLoader />}><WorkspaceSettings /></Suspense>,
      },
      {
        path: "help",
        element: <Suspense fallback={<PageLoader />}><HelpCenter /></Suspense>,
      },
      {
        path: "sdk",
        element: <Suspense fallback={<PageLoader />}><DeveloperSDK /></Suspense>,
      },
      {
        path: "manual",
        element: <Suspense fallback={<PageLoader />}><UserManual /></Suspense>,
      },
      {
        path: "notifications",
        element: <Suspense fallback={<PageLoader />}><WorkspaceNotifications /></Suspense>,
      },
      {
        path: "activity",
        element: <Suspense fallback={<PageLoader />}><WorkspaceActivity /></Suspense>,
      },
      {
        path: "changelog",
        element: <Suspense fallback={<PageLoader />}><WorkspaceChangelog /></Suspense>,
      },
      {
        path: "*",
        element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
      }
    ]
  },
  {
    path: "/admin",
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    errorElement: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
    children: [
      {
        path: "",
        element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>,
      },
      {
        path: "users",
        element: <Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>,
      },
      {
        path: "requests",
        element: <Suspense fallback={<PageLoader />}><AdminPlans /></Suspense>,
      },
      {
        path: "system",
        element: <Suspense fallback={<PageLoader />}><AdminSystem /></Suspense>,
      },
      {
        path: "infrastructure",
        element: <Suspense fallback={<PageLoader />}><AdminInfrastructure /></Suspense>,
      },
      {
        path: "security",
        element: <Suspense fallback={<PageLoader />}><AdminSecurityLogs /></Suspense>,
      },
      {
        path: "datasets",
        element: <Suspense fallback={<PageLoader />}><AdminDatasets /></Suspense>,
      },
      {
        path: "projects",
        element: <Suspense fallback={<PageLoader />}><AdminProjects /></Suspense>,
      },
      {
        path: "roles",
        element: <Suspense fallback={<PageLoader />}><AdminRoles /></Suspense>,
      },
      {
        path: "audit-logs",
        element: <Suspense fallback={<PageLoader />}><AdminAuditLogs /></Suspense>,
      },
      {
        path: "errors",
        element: <Suspense fallback={<PageLoader />}><AdminDiagnosticsConsole /></Suspense>,
      },
      {
        path: "emails",
        element: <Suspense fallback={<PageLoader />}><AdminEmails /></Suspense>,
      },
      {
        path: "*",
        element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
      }
    ]
  },
  {
    path: "*",
    element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
  }
]);

export default function App() {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vivexa-ui-theme">
          <RouterProvider router={router} />
          <Toaster position="top-right" theme="dark" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}


