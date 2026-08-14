-- =====================================================================
-- VIVEXA PLATFORM - COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- Compatible with Supabase SQL Editor
-- =====================================================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for updating updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 2. CORE TABLES
-- =====================================================================

-- USERS (Public extension table mapping 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    plan TEXT DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROFILES
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

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    is_personal BOOLEAN DEFAULT false,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WORKSPACE_MEMBERS
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

-- WORKSPACE INVITATIONS
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

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    business_goal TEXT,
    color TEXT DEFAULT 'indigo',
    icon TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Archived', 'Draft')),
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DATASETS
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    type TEXT DEFAULT 'csv',
    rows INTEGER DEFAULT 0,
    cols INTEGER DEFAULT 0,
    quality INTEGER DEFAULT 100,
    status TEXT DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'error')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DATASET_VERSIONS
CREATE TABLE IF NOT EXISTS public.dataset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    storage_path TEXT NOT NULL,
    changes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dataset_id, version)
);

-- PROJECT_ACTIVITY
CREATE TABLE IF NOT EXISTS public.project_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    file_path TEXT,
    status TEXT DEFAULT 'generated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLANS
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_inr NUMERIC NOT NULL DEFAULT 0,
    billing_cycle TEXT DEFAULT 'monthly',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    plan_id TEXT NOT NULL REFERENCES public.plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    renews_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USAGE_LOGS
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    amount INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FEATURE_FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API_KEYS
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'development', 'test')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "email_notifications": true,
        "auto_save": true,
        "language": "en",
        "timezone": "Asia/Kolkata"
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI_CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'New AI Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI_MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    confidence INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON public.datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON public.dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_project_id ON public.project_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_user_id ON public.project_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- =====================================================================
-- 4. TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================================

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_organizations_updated_at ON public.organizations;
CREATE TRIGGER tr_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER tr_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_datasets_updated_at ON public.datasets;
CREATE TRIGGER tr_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_reports_updated_at ON public.reports;
CREATE TRIGGER tr_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_settings_updated_at ON public.settings;
CREATE TRIGGER tr_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER tr_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================================
-- 5. SIGNUP AUTOMATION TRIGGERS (USER, PROFILE, WORKSPACE, SETTINGS)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_full_name TEXT;
    v_workspace_id UUID;
BEGIN
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_full_name := TRIM(CONCAT(v_first_name, ' ', v_last_name));
    IF v_full_name = '' THEN
        v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    END IF;

    -- 1. Insert into public.users
    INSERT INTO public.users (id, email, role, plan)
    VALUES (NEW.id, NEW.email, 'user', 'free')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

    -- 2. Insert into public.profiles
    INSERT INTO public.profiles (user_id, full_name, company, role)
    VALUES (
        NEW.id, 
        v_full_name, 
        COALESCE(NEW.raw_user_meta_data->>'company', ''),
        'User'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Create personal workspace for user if none exists
    SELECT id INTO v_workspace_id
    FROM public.workspaces
    WHERE owner_id = NEW.id AND is_personal = true
    LIMIT 1;

    IF v_workspace_id IS NULL THEN
        INSERT INTO public.workspaces (name, is_personal, owner_id)
        VALUES (
            CONCAT(v_full_name, '''s Workspace'),
            true,
            NEW.id
        )
        RETURNING id INTO v_workspace_id;

        -- 4. Add user as owner in workspace_members
        IF v_workspace_id IS NOT NULL THEN
            INSERT INTO public.workspace_members (workspace_id, user_id, role)
            VALUES (v_workspace_id, NEW.id, 'owner')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- 5. Insert default settings
    INSERT INTO public.settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- 6. Insert initial subscription
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;

    -- 7. Audit log
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
    VALUES (NEW.id, 'user_registered', 'users', NEW.id::text);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- =====================================================================
-- 6. PROJECT ACTIVITY & AUDIT LOGGING TRIGGERS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.project_activity (project_id, user_id, action, details)
        VALUES (NEW.id, NEW.owner_id, 'Project Created', CONCAT('Created project "', NEW.name, '"'));
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.name <> NEW.name THEN
            INSERT INTO public.project_activity (project_id, user_id, action, details)
            VALUES (NEW.id, NEW.owner_id, 'Project Renamed', CONCAT('Renamed project to "', NEW.name, '"'));
        ELSIF OLD.is_archived <> NEW.is_archived AND NEW.is_archived = true THEN
            INSERT INTO public.project_activity (project_id, user_id, action, details)
            VALUES (NEW.id, NEW.owner_id, 'Project Archived', CONCAT('Archived project "', NEW.name, '"'));
        ELSIF OLD.is_archived <> NEW.is_archived AND NEW.is_archived = false THEN
            INSERT INTO public.project_activity (project_id, user_id, action, details)
            VALUES (NEW.id, NEW.owner_id, 'Project Restored', CONCAT('Restored project "', NEW.name, '"'));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_project_activity ON public.projects;
CREATE TRIGGER tr_project_activity
    AFTER INSERT OR UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.log_project_activity();

-- =====================================================================
-- 6B. EMAIL LOGS & DELIVERY TRACKING
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient TEXT NOT NULL,
    sender TEXT NOT NULL,
    subject TEXT,
    template TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'opened', 'clicked', 'delivered', 'failed')),
    provider TEXT DEFAULT 'Resend',
    provider_message_id TEXT,
    retry_count INTEGER DEFAULT 0,
    response_metadata JSONB DEFAULT '{}'::jsonb,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS) & POLICIES
-- =====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Helper function to retrieve all organization IDs associated with a user (owner or member)
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT id FROM public.organizations WHERE owner_id = user_id
    UNION
    SELECT DISTINCT w.organization_id 
    FROM public.workspace_members wm
    JOIN public.workspaces w ON wm.workspace_id = w.id
    WHERE wm.user_id = user_id AND w.organization_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users
CREATE POLICY "Users view own user record" ON public.users FOR SELECT USING (auth.uid() = id OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));
CREATE POLICY "Users insert own user record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own user record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Profiles updateable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Workspaces
CREATE POLICY "Workspaces viewable by owner" ON public.workspaces FOR SELECT USING (auth.uid() = owner_id OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));
CREATE POLICY "Workspaces insertable by authenticated" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Workspaces updateable by owner" ON public.workspaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Workspaces deleteable by owner" ON public.workspaces FOR DELETE USING (auth.uid() = owner_id);

-- Workspace Members
CREATE POLICY "Members viewable by user" ON public.workspace_members FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()) OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));
CREATE POLICY "Members manageable by owner" ON public.workspace_members FOR ALL USING (EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()) OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));

-- Workspace Invitations
CREATE POLICY "Invitations viewable by owner or invitee" ON public.workspace_invitations FOR SELECT USING (
    invited_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email = workspace_invitations.email) OR
    (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
);
CREATE POLICY "Invitations manageable by workspace owner" ON public.workspace_invitations FOR ALL USING (
    invited_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid()) OR
    (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
);

-- Projects
CREATE POLICY "Projects viewable by owner" ON public.projects FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR owner_id = auth.uid() OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
);
CREATE POLICY "Projects insertable by owner" ON public.projects FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR owner_id = auth.uid()
);
CREATE POLICY "Projects updateable by owner" ON public.projects FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR owner_id = auth.uid()
);
CREATE POLICY "Projects deleteable by owner" ON public.projects FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.workspaces w
        WHERE w.id = workspace_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR owner_id = auth.uid()
);

-- Datasets
CREATE POLICY "Datasets viewable by owner" ON public.datasets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid() OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
);
CREATE POLICY "Datasets insertable by owner" ON public.datasets FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid()
);
CREATE POLICY "Datasets updateable by owner" ON public.datasets FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid()
);
CREATE POLICY "Datasets deleteable by owner" ON public.datasets FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid()
);

-- Dataset Versions
CREATE POLICY "Dataset versions viewable by dataset owner" ON public.dataset_versions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.datasets WHERE id = dataset_id AND user_id = auth.uid()) OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));

-- Project Activity
CREATE POLICY "Activity viewable by user" ON public.project_activity FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com'));

-- Reports
CREATE POLICY "Reports viewable by owner" ON public.reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid() OR (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
);
CREATE POLICY "Reports insertable by owner" ON public.reports FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid()
);
CREATE POLICY "Reports updateable by owner" ON public.reports FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid()
);
CREATE POLICY "Reports deleteable by owner" ON public.reports FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspaces w ON p.workspace_id = w.id
        WHERE p.id = project_id
        AND w.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
    ) OR user_id = auth.uid()
);

-- Notifications
CREATE POLICY "Notifications viewable by user" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notifications updateable by user" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Plans (Public read-only)
CREATE POLICY "Plans publicly viewable" ON public.plans FOR SELECT USING (true);

-- Subscriptions
CREATE POLICY "Subscriptions viewable by user" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Subscriptions insertable by owner" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings
CREATE POLICY "Settings viewable by owner" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Settings insertable by owner" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Settings updateable by owner" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- Feature Flags (Public read-only)
CREATE POLICY "Feature flags publicly viewable" ON public.feature_flags FOR SELECT USING (true);

-- API Keys
CREATE POLICY "API keys viewable by owner" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "API keys manageable by owner" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

-- AI Conversations
CREATE POLICY "AI Conversations viewable by owner" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "AI Conversations manageable by owner" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

-- AI Messages
CREATE POLICY "AI Messages viewable by conversation owner" ON public.ai_messages FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "AI Messages insertable by conversation owner" ON public.ai_messages FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- Email Logs
CREATE POLICY "Email logs viewable by recipient or admin" ON public.email_logs FOR SELECT 
    USING (recipient = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Email logs manageable by admins" ON public.email_logs FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

-- =====================================================================
-- 8. STORAGE BUCKETS & STORAGE POLICIES
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('datasets', 'datasets', false, 104857600, NULL),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
    ('reports', 'reports', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'datasets'
DROP POLICY IF EXISTS "Authenticated dataset upload" ON storage.objects;
CREATE POLICY "Authenticated dataset upload" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'datasets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Dataset owner read" ON storage.objects;
CREATE POLICY "Dataset owner read" ON storage.objects FOR SELECT 
    USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Dataset owner delete" ON storage.objects;
CREATE POLICY "Dataset owner delete" ON storage.objects FOR DELETE 
    USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for 'avatars'
DROP POLICY IF EXISTS "Public avatar view" ON storage.objects;
CREATE POLICY "Public avatar view" ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "User avatar upload" ON storage.objects;
CREATE POLICY "User avatar upload" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage Policies for 'reports'
DROP POLICY IF EXISTS "Report owner read" ON storage.objects;
CREATE POLICY "Report owner read" ON storage.objects FOR SELECT 
    USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Report owner upload" ON storage.objects;
CREATE POLICY "Report owner upload" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- =====================================================================
-- 9. DEFAULT SEED DATA (PLANS & FEATURE FLAGS)
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
    ('custom_models', 'Custom ML Models', false, 'Train custom machine learning models on datasets')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
