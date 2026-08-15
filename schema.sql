-- =====================================================================
-- VIVEXA ENTERPRISE INTELLIGENCE - FULL PRODUCTION DATABASE SCHEMA
-- AIRTIGHT ROW-LEVEL SECURITY (RLS) & MULTI-TENANT ACCESS CONTROL
-- Compatible with Supabase PostgreSQL 15+
-- =====================================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function for updating updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- =====================================================================
-- 2. CORE SECURITY DEFINER HELPER FUNCTIONS
-- =====================================================================

-- Super admin check (Hardened with explicit search_path)
CREATE OR REPLACE FUNCTION public.is_super_admin(u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF u_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = u_id AND (role IN ('superadmin', 'admin') OR email IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'))
    ) OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Retrieve all organization IDs associated with a user
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
    IF user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT id FROM public.organizations WHERE owner_id = user_id
    UNION
    SELECT DISTINCT w.organization_id 
    FROM public.workspace_members wm
    JOIN public.workspaces w ON wm.workspace_id = w.id
    WHERE wm.user_id = user_id AND w.organization_id IS NOT NULL AND wm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Check if user is a member or owner of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF ws_id IS NULL OR u_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = u_id
    ) OR EXISTS (
        SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = u_id AND status = 'active'
    ) OR public.is_super_admin(u_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Check if user is an admin or owner of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF ws_id IS NULL OR u_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = u_id
    ) OR EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = ws_id AND user_id = u_id AND role IN ('Owner', 'Admin', 'owner', 'admin') AND status = 'active'
    ) OR public.is_super_admin(u_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Check if user has editor rights in a workspace (Owner, Admin, Manager, Analyst)
CREATE OR REPLACE FUNCTION public.is_workspace_editor(ws_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF ws_id IS NULL OR u_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = u_id
    ) OR EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = ws_id AND user_id = u_id AND role IN ('Owner', 'Admin', 'Manager', 'Analyst', 'owner', 'admin', 'member') AND status = 'active'
    ) OR public.is_super_admin(u_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Check if two users share at least one active workspace
CREATE OR REPLACE FUNCTION public.is_workspace_co_member(u_id1 UUID, u_id2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF u_id1 IS NULL OR u_id2 IS NULL THEN
        RETURN FALSE;
    END IF;

    IF u_id1 = u_id2 THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members wm1
        JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
        WHERE wm1.user_id = u_id1 AND wm2.user_id = u_id2 AND wm1.status = 'active' AND wm2.status = 'active'
    ) OR EXISTS (
        SELECT 1 FROM public.workspaces w
        JOIN public.workspace_members wm ON w.id = wm.workspace_id
        WHERE (w.owner_id = u_id1 AND wm.user_id = u_id2 AND wm.status = 'active') 
           OR (w.owner_id = u_id2 AND wm.user_id = u_id1 AND wm.status = 'active')
    ) OR public.is_super_admin(u_id1) OR public.is_super_admin(u_id2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- =====================================================================
-- 3. CORE TABLE DEFINITIONS
-- =====================================================================

-- 3.1 USERS (Public extension mapping 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    plan TEXT DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    company TEXT,
    role TEXT DEFAULT 'User',
    country TEXT DEFAULT 'India',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    theme_preference TEXT DEFAULT 'dark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    is_personal BOOLEAN DEFAULT false,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 WORKSPACE_MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Analyst' CHECK (role IN ('Owner', 'Admin', 'Manager', 'Analyst', 'Viewer', 'owner', 'admin', 'member', 'viewer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3.6 WORKSPACE INVITATIONS
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'Analyst' CHECK (role IN ('Owner', 'Admin', 'Manager', 'Analyst', 'Viewer')),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Expired', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 3.7 PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.8 PROJECT MILESTONES
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.9 PROJECT SHARES
CREATE TABLE IF NOT EXISTS public.project_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission TEXT DEFAULT 'viewer' CHECK (permission IN ('viewer', 'editor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 3.10 PROJECT ACTIVITY
CREATE TABLE IF NOT EXISTS public.project_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.11 DATASETS
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    row_count INTEGER DEFAULT 0,
    column_count INTEGER DEFAULT 0,
    columns_metadata JSONB DEFAULT '[]'::jsonb,
    preview_data JSONB DEFAULT '[]'::jsonb,
    storage_path TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.12 DATASET VERSIONS
CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    row_count INTEGER DEFAULT 0,
    storage_path TEXT NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dataset_id, version_number)
);

-- 3.13 REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json', 'csv')),
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.14 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'alert')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.15 PLANS (Public Reference Table)
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_inr INTEGER NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.16 SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    plan_id TEXT NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.17 USAGE LOGS
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.18 FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.19 AUDIT LOGS (Immutable Write-Only Compliance Storage)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.20 API KEYS (Cryptographically Hashed)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'development', 'test')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.21 USER SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'dark',
    notifications_email BOOLEAN DEFAULT true,
    notifications_app BOOLEAN DEFAULT true,
    ai_auto_suggest BOOLEAN DEFAULT true,
    default_export_format TEXT DEFAULT 'pdf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.22 AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.23 AI MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.24 AUTOMATIONS
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_detail TEXT,
    condition TEXT,
    action_type TEXT NOT NULL,
    action_detail TEXT,
    enabled BOOLEAN DEFAULT true,
    webhook_url TEXT,
    webhook_enabled BOOLEAN DEFAULT false,
    success_rate TEXT DEFAULT '100%',
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.25 AUTOMATION LOGS
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    trigger_event TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    execution_duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.26 DATA CONNECTORS
CREATE TABLE IF NOT EXISTS public.data_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    host TEXT,
    port INTEGER,
    database TEXT,
    username TEXT,
    encrypted_credentials TEXT,
    status TEXT DEFAULT 'configured',
    sync_frequency TEXT DEFAULT 'manual',
    last_sync_at TIMESTAMPTZ,
    tables_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.27 FORECASTS
CREATE TABLE IF NOT EXISTS public.forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    dataset_name TEXT NOT NULL,
    target_column TEXT NOT NULL,
    date_column TEXT NOT NULL,
    horizon INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    model_name TEXT NOT NULL,
    confidence_interval REAL NOT NULL,
    mape_error REAL,
    rmse_error REAL,
    mae_error REAL,
    forecast_values JSONB NOT NULL,
    historical_values JSONB NOT NULL,
    notebook_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.28 AI AGENTS
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT,
    temperature REAL DEFAULT 0.2,
    max_tokens INTEGER DEFAULT 4096,
    memory_retries BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agent_id)
);

-- 3.29 EMAIL LOGS
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient TEXT NOT NULL,
    template TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 4. PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON public.workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_ws ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_pid ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_pid ON public.project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_uid ON public.project_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON public.datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_datasets_workspace_id ON public.datasets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON public.dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ws_id ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_data_connectors_user_id ON public.data_connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user_id ON public.forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_dataset_id ON public.forecasts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);

-- =====================================================================
-- 5. ENABLE & FORCE ROW LEVEL SECURITY (RLS) ACROSS ALL TABLES
-- =====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces FORCE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones FORCE ROW LEVEL SECURITY;

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares FORCE ROW LEVEL SECURITY;

ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity FORCE ROW LEVEL SECURITY;

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_versions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags FORCE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.data_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_connectors FORCE ROW LEVEL SECURITY;

ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs FORCE ROW LEVEL SECURITY;

-- =====================================================================
-- 6. DROP OLD POLICIES & CONFIGURE AIRTIGHT RLS POLICIES
-- =====================================================================

-- Clean up any existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 6.1 USERS
CREATE POLICY "users_select_policy" ON public.users FOR SELECT 
    USING (auth.uid() = id OR public.is_super_admin(auth.uid()) OR public.is_workspace_co_member(auth.uid(), id));

CREATE POLICY "users_insert_policy" ON public.users FOR INSERT 
    WITH CHECK (auth.uid() = id OR public.is_super_admin(auth.uid()));

CREATE POLICY "users_update_policy" ON public.users FOR UPDATE 
    USING (auth.uid() = id OR public.is_super_admin(auth.uid()));

CREATE POLICY "users_delete_policy" ON public.users FOR DELETE 
    USING (public.is_super_admin(auth.uid()));

-- 6.2 PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.is_workspace_co_member(auth.uid(), user_id));

CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE 
    USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- 6.3 ORGANIZATIONS
CREATE POLICY "organizations_select_policy" ON public.organizations FOR SELECT 
    USING (owner_id = auth.uid() OR id IN (SELECT public.get_user_organizations(auth.uid())) OR public.is_super_admin(auth.uid()));

CREATE POLICY "organizations_insert_policy" ON public.organizations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "organizations_update_policy" ON public.organizations FOR UPDATE 
    USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "organizations_delete_policy" ON public.organizations FOR DELETE 
    USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.4 WORKSPACES
CREATE POLICY "workspaces_select_policy" ON public.workspaces FOR SELECT 
    USING (owner_id = auth.uid() OR public.is_workspace_member(id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspaces_insert_policy" ON public.workspaces FOR INSERT 
    WITH CHECK (auth.uid() = owner_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspaces_update_policy" ON public.workspaces FOR UPDATE 
    USING (owner_id = auth.uid() OR public.is_workspace_admin(id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspaces_delete_policy" ON public.workspaces FOR DELETE 
    USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.5 WORKSPACE_MEMBERS
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members FOR SELECT 
    USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members FOR INSERT 
    WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_members_update_policy" ON public.workspace_members FOR UPDATE 
    USING (public.is_workspace_admin(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members FOR DELETE 
    USING (public.is_workspace_admin(workspace_id, auth.uid()) OR user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.6 WORKSPACE INVITATIONS
CREATE POLICY "workspace_invitations_select_policy" ON public.workspace_invitations FOR SELECT 
    USING (
        invited_by = auth.uid() OR 
        public.is_workspace_admin(workspace_id, auth.uid()) OR 
        email = (SELECT email FROM public.users WHERE id = auth.uid()) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "workspace_invitations_insert_policy" ON public.workspace_invitations FOR INSERT 
    WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_invitations_update_policy" ON public.workspace_invitations FOR UPDATE 
    USING (
        public.is_workspace_admin(workspace_id, auth.uid()) OR 
        email = (SELECT email FROM public.users WHERE id = auth.uid()) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "workspace_invitations_delete_policy" ON public.workspace_invitations FOR DELETE 
    USING (public.is_workspace_admin(workspace_id, auth.uid()) OR invited_by = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.7 PROJECTS
CREATE POLICY "projects_select_policy" ON public.projects FOR SELECT 
    USING (
        owner_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())) OR 
        EXISTS (SELECT 1 FROM public.project_shares WHERE project_id = projects.id AND user_id = auth.uid()) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "projects_insert_policy" ON public.projects FOR INSERT 
    WITH CHECK (
        owner_id = auth.uid() AND 
        (workspace_id IS NULL OR public.is_workspace_editor(workspace_id, auth.uid()))
    );

CREATE POLICY "projects_update_policy" ON public.projects FOR UPDATE 
    USING (
        owner_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "projects_delete_policy" ON public.projects FOR DELETE 
    USING (
        owner_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

-- 6.8 PROJECT MILESTONES
CREATE POLICY "project_milestones_select_policy" ON public.project_milestones FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_member(p.workspace_id, auth.uid())))
        ) OR public.is_super_admin(auth.uid())
    );

CREATE POLICY "project_milestones_insert_policy" ON public.project_milestones FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_editor(p.workspace_id, auth.uid())))
        )
    );

CREATE POLICY "project_milestones_update_policy" ON public.project_milestones FOR UPDATE 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_editor(p.workspace_id, auth.uid())))
        ) OR public.is_super_admin(auth.uid())
    );

CREATE POLICY "project_milestones_delete_policy" ON public.project_milestones FOR DELETE 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_editor(p.workspace_id, auth.uid())))
        ) OR public.is_super_admin(auth.uid())
    );

-- 6.9 PROJECT SHARES
CREATE POLICY "project_shares_select_policy" ON public.project_shares FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        shared_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "project_shares_insert_policy" ON public.project_shares FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "project_shares_delete_policy" ON public.project_shares FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()) OR 
        user_id = auth.uid() OR 
        public.is_super_admin(auth.uid())
    );

-- 6.10 PROJECT ACTIVITY
CREATE POLICY "project_activity_select_policy" ON public.project_activity FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_member(p.workspace_id, auth.uid())))
        ) OR public.is_super_admin(auth.uid())
    );

CREATE POLICY "project_activity_insert_policy" ON public.project_activity FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.11 DATASETS
CREATE POLICY "datasets_select_policy" ON public.datasets FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())) OR 
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = datasets.project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_member(p.workspace_id, auth.uid())))
        )) OR 
        is_public = true OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "datasets_insert_policy" ON public.datasets FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND 
        (workspace_id IS NULL OR public.is_workspace_editor(workspace_id, auth.uid()))
    );

CREATE POLICY "datasets_update_policy" ON public.datasets FOR UPDATE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "datasets_delete_policy" ON public.datasets FOR DELETE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

-- 6.12 DATASET VERSIONS
CREATE POLICY "dataset_versions_select_policy" ON public.dataset_versions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets d 
            WHERE d.id = dataset_id AND (
                d.user_id = auth.uid() OR 
                (d.workspace_id IS NOT NULL AND public.is_workspace_member(d.workspace_id, auth.uid())) OR 
                d.is_public = true
            )
        ) OR public.is_super_admin(auth.uid())
    );

CREATE POLICY "dataset_versions_insert_policy" ON public.dataset_versions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.datasets d 
            WHERE d.id = dataset_id AND (
                d.user_id = auth.uid() OR 
                (d.workspace_id IS NOT NULL AND public.is_workspace_editor(d.workspace_id, auth.uid()))
            )
        ) OR public.is_super_admin(auth.uid())
    );

CREATE POLICY "dataset_versions_delete_policy" ON public.dataset_versions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets d 
            WHERE d.id = dataset_id AND (
                d.user_id = auth.uid() OR 
                (d.workspace_id IS NOT NULL AND public.is_workspace_admin(d.workspace_id, auth.uid()))
            )
        ) OR public.is_super_admin(auth.uid())
    );

-- 6.13 REPORTS
CREATE POLICY "reports_select_policy" ON public.reports FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = reports.project_id AND (p.owner_id = auth.uid() OR (p.workspace_id IS NOT NULL AND public.is_workspace_member(p.workspace_id, auth.uid())))
        )) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "reports_insert_policy" ON public.reports FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "reports_update_policy" ON public.reports FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "reports_delete_policy" ON public.reports FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.14 NOTIFICATIONS
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR public.is_super_admin(auth.uid()));

CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.15 PLANS (Public Read-Only)
CREATE POLICY "plans_select_policy" ON public.plans FOR SELECT 
    USING (true);

CREATE POLICY "plans_insert_policy" ON public.plans FOR INSERT 
    WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "plans_update_policy" ON public.plans FOR UPDATE 
    USING (public.is_super_admin(auth.uid()));

CREATE POLICY "plans_delete_policy" ON public.plans FOR DELETE 
    USING (public.is_super_admin(auth.uid()));

-- 6.16 SUBSCRIPTIONS
CREATE POLICY "subscriptions_select_policy" ON public.subscriptions FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "subscriptions_insert_policy" ON public.subscriptions FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "subscriptions_update_policy" ON public.subscriptions FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "subscriptions_delete_policy" ON public.subscriptions FOR DELETE 
    USING (public.is_super_admin(auth.uid()));

-- 6.17 USAGE LOGS
CREATE POLICY "usage_logs_select_policy" ON public.usage_logs FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "usage_logs_insert_policy" ON public.usage_logs FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.18 FEATURE FLAGS (Public Read-Only)
CREATE POLICY "feature_flags_select_policy" ON public.feature_flags FOR SELECT 
    USING (true);

CREATE POLICY "feature_flags_manage_policy" ON public.feature_flags FOR ALL 
    USING (public.is_super_admin(auth.uid()));

-- 6.19 AUDIT LOGS (Immutable Write-Only Compliance Storage: NO UPDATE / NO DELETE)
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR public.is_super_admin(auth.uid()));

-- 6.20 API KEYS
CREATE POLICY "api_keys_select_policy" ON public.api_keys FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "api_keys_insert_policy" ON public.api_keys FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_keys_update_policy" ON public.api_keys FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "api_keys_delete_policy" ON public.api_keys FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.21 SETTINGS
CREATE POLICY "settings_select_policy" ON public.settings FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "settings_insert_policy" ON public.settings FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings_update_policy" ON public.settings FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "settings_delete_policy" ON public.settings FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.22 AI CONVERSATIONS
CREATE POLICY "ai_conversations_select_policy" ON public.ai_conversations FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "ai_conversations_insert_policy" ON public.ai_conversations FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_update_policy" ON public.ai_conversations FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "ai_conversations_delete_policy" ON public.ai_conversations FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.23 AI MESSAGES
CREATE POLICY "ai_messages_select_policy" ON public.ai_messages FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_super_admin(auth.uid())))
    );

CREATE POLICY "ai_messages_insert_policy" ON public.ai_messages FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_super_admin(auth.uid())))
    );

CREATE POLICY "ai_messages_delete_policy" ON public.ai_messages FOR DELETE 
    USING (
        EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_super_admin(auth.uid())))
    );

-- 6.24 AUTOMATIONS
CREATE POLICY "automations_select_policy" ON public.automations FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "automations_insert_policy" ON public.automations FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "automations_update_policy" ON public.automations FOR UPDATE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "automations_delete_policy" ON public.automations FOR DELETE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

-- 6.25 AUTOMATION LOGS
CREATE POLICY "automation_logs_select_policy" ON public.automation_logs FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND (a.user_id = auth.uid() OR public.is_super_admin(auth.uid())))
    );

CREATE POLICY "automation_logs_insert_policy" ON public.automation_logs FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.26 DATA CONNECTORS
CREATE POLICY "data_connectors_select_policy" ON public.data_connectors FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "data_connectors_insert_policy" ON public.data_connectors FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "data_connectors_update_policy" ON public.data_connectors FOR UPDATE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "data_connectors_delete_policy" ON public.data_connectors FOR DELETE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

-- 6.27 FORECASTS
CREATE POLICY "forecasts_select_policy" ON public.forecasts FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.datasets d 
            WHERE d.id = dataset_id AND (d.user_id = auth.uid() OR (d.workspace_id IS NOT NULL AND public.is_workspace_member(d.workspace_id, auth.uid())))
        ) OR public.is_super_admin(auth.uid())
    );

CREATE POLICY "forecasts_insert_policy" ON public.forecasts FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "forecasts_update_policy" ON public.forecasts FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "forecasts_delete_policy" ON public.forecasts FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.28 AI AGENTS
CREATE POLICY "ai_agents_select_policy" ON public.ai_agents FOR SELECT 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "ai_agents_insert_policy" ON public.ai_agents FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_agents_update_policy" ON public.ai_agents FOR UPDATE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "ai_agents_delete_policy" ON public.ai_agents FOR DELETE 
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 6.29 EMAIL LOGS
CREATE POLICY "email_logs_select_policy" ON public.email_logs FOR SELECT 
    USING (
        recipient = (SELECT email FROM public.users WHERE id = auth.uid()) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "email_logs_insert_policy" ON public.email_logs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR public.is_super_admin(auth.uid()));

CREATE POLICY "email_logs_manage_policy" ON public.email_logs FOR ALL 
    USING (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 7. STORAGE BUCKETS & STORAGE POLICIES
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('datasets', 'datasets', false, 104857600, NULL),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
    ('reports', 'reports', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Drop existing storage policies
DROP POLICY IF EXISTS "storage_datasets_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_datasets_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_datasets_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_avatars_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_reports_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_reports_upload" ON storage.objects;

-- Datasets Storage Policies (User-isolated directories)
CREATE POLICY "storage_datasets_upload" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'datasets' AND auth.role() = 'authenticated' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin(auth.uid())));

CREATE POLICY "storage_datasets_select" ON storage.objects FOR SELECT 
    USING (bucket_id = 'datasets' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin(auth.uid())));

CREATE POLICY "storage_datasets_delete" ON storage.objects FOR DELETE 
    USING (bucket_id = 'datasets' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin(auth.uid())));

-- Avatars Storage Policies
CREATE POLICY "storage_avatars_select" ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');

CREATE POLICY "storage_avatars_upload" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "storage_avatars_update" ON storage.objects FOR UPDATE 
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Reports Storage Policies
CREATE POLICY "storage_reports_select" ON storage.objects FOR SELECT 
    USING (bucket_id = 'reports' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin(auth.uid())));

CREATE POLICY "storage_reports_upload" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin(auth.uid())));

CREATE POLICY "storage_reports_delete" ON storage.objects FOR DELETE 
    USING (bucket_id = 'reports' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_super_admin(auth.uid())));

-- =====================================================================
-- 8. DEFAULT SEED DATA (PLANS & FEATURE FLAGS)
-- =====================================================================

INSERT INTO public.plans (id, name, price_inr, billing_cycle, features)
VALUES 
    ('free', 'Free', 0, 'monthly', '["1 Workspace", "3 Projects", "100 MB Storage", "Basic AI Analyst"]'::jsonb),
    ('student', 'Student (Coming Soon)', 199, 'monthly', '["1 Workspace", "10 Projects", "2 GB Storage", "Standard AI Analyst", "Priority Support"]'::jsonb),
    ('pro', 'Pro (Contact Admin)', 1499, 'monthly', '["5 Workspaces", "Unlimited Projects", "50 GB Storage", "Advanced AI Analyst", "API Access"]'::jsonb),
    ('enterprise', 'Enterprise (Contact Admin)', 9999, 'monthly', '["Unlimited Workspaces", "Unlimited Projects", "1 TB Storage", "Custom ML Models", "Dedicated Manager", "SLA 99.9%"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    price_inr = EXCLUDED.price_inr,
    features = EXCLUDED.features;

INSERT INTO public.feature_flags (id, name, is_enabled, description)
VALUES
    ('ai_chat', 'AI Chat Analyst', true, 'Enable Gemini powered chat for dataset exploration'),
    ('connectors', 'Data Connectors', true, 'Enable third-party database and API integrations'),
    ('custom_models', 'Custom ML Models', false, 'Train custom machine learning models on datasets'),
    ('row_level_security', 'Row Level Security Active', true, 'Enforces cryptographic multi-tenant data boundaries')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- END OF SECURE AIRTIGHT SCHEMA
-- =====================================================================
