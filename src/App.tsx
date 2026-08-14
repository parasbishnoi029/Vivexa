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

// Reusable loader
const PageLoader = () => (
  <div className="w-full h-[60vh] flex items-center justify-center">
    <Skeleton className="w-full max-w-4xl h-full rounded-xl" />
  </div>
);

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


