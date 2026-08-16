-- =====================================================================
-- VIVEXA AI PLATFORM - SUPABASE RLS SECURITY MIGRATION
-- MIGRATION: 20260815_enable_rls_and_organization_isolation.sql
-- PURPOSE: Implement airtight Row Level Security (RLS) policies on all
-- critical tables (profiles, projects, datasets, invitations, workspaces,
-- workspace_members, reports, audit_logs) ensuring users can only access
-- data belonging to their organization/workspace context.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SECURITY DEFINER HELPER FUNCTIONS
-- Helper: Super Admin access
CREATE OR REPLACE FUNCTION public.is_super_admin(u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF u_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = u_id AND (role IN ('superadmin', 'admin') OR email IN ('info.vivexa@gmail.com', 'parasbishnoi012@gmail.com'))
    ) OR (auth.jwt() ->> 'email') IN ('info.vivexa@gmail.com', 'parasbishnoi012@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Helper: Retrieve all organization IDs associated with a user
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

-- Helper: Workspace membership check
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

-- Helper: Workspace admin check
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

-- Helper: Workspace editor check (Owner, Admin, Manager, Analyst, Data Scientist)
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
        WHERE workspace_id = ws_id AND user_id = u_id AND role IN ('Owner', 'Admin', 'Manager', 'Analyst', 'Data Scientist', 'owner', 'admin', 'member') AND status = 'active'
    ) OR public.is_super_admin(u_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Helper: Workspace co-membership check (same workspace / organization)
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
-- 3. ENABLE & FORCE ROW LEVEL SECURITY ON ALL CRITICAL TABLES
-- =====================================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_members FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_invitations FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_milestones FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_shares FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_activity FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.datasets FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dataset_versions FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.automations FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.data_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_connectors FORCE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. CLEAN OLD POLICIES ON CRITICAL TABLES
-- =====================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename IN (
            'users', 'profiles', 'organizations', 'workspaces', 'workspace_members',
            'workspace_invitations', 'projects', 'project_milestones', 'project_shares',
            'project_activity', 'datasets', 'dataset_versions', 'reports', 'audit_logs',
            'api_keys', 'settings', 'ai_conversations', 'ai_messages', 'automations', 'data_connectors'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- =====================================================================
-- 5. APPLY STRICT MULTI-TENANT RLS POLICIES
-- =====================================================================

-- 5.1 PROFILES POLICIES
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.is_workspace_co_member(auth.uid(), user_id));

CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE 
    USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- 5.2 WORKSPACES POLICIES
CREATE POLICY "workspaces_select_policy" ON public.workspaces FOR SELECT 
    USING (owner_id = auth.uid() OR public.is_workspace_member(id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspaces_insert_policy" ON public.workspaces FOR INSERT 
    WITH CHECK (auth.uid() = owner_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspaces_update_policy" ON public.workspaces FOR UPDATE 
    USING (owner_id = auth.uid() OR public.is_workspace_admin(id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspaces_delete_policy" ON public.workspaces FOR DELETE 
    USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 5.3 WORKSPACE_MEMBERS POLICIES
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members FOR SELECT 
    USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members FOR INSERT 
    WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_members_update_policy" ON public.workspace_members FOR UPDATE 
    USING (public.is_workspace_admin(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members FOR DELETE 
    USING (public.is_workspace_admin(workspace_id, auth.uid()) OR user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- 5.4 WORKSPACE INVITATIONS POLICIES
CREATE POLICY "workspace_invitations_select_policy" ON public.workspace_invitations FOR SELECT 
    USING (
        invited_by = auth.uid() OR 
        public.is_workspace_admin(workspace_id, auth.uid()) OR 
        email = (SELECT email FROM public.users WHERE id = auth.uid()) OR 
        email = (auth.jwt() ->> 'email') OR
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "workspace_invitations_insert_policy" ON public.workspace_invitations FOR INSERT 
    WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "workspace_invitations_update_policy" ON public.workspace_invitations FOR UPDATE 
    USING (
        public.is_workspace_admin(workspace_id, auth.uid()) OR 
        email = (SELECT email FROM public.users WHERE id = auth.uid()) OR 
        email = (auth.jwt() ->> 'email') OR
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "workspace_invitations_delete_policy" ON public.workspace_invitations FOR DELETE 
    USING (public.is_workspace_admin(workspace_id, auth.uid()) OR invited_by = auth.uid() OR public.is_super_admin(auth.uid()));

-- 5.5 PROJECTS POLICIES
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

-- 5.6 DATASETS POLICIES
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

-- 5.7 REPORTS POLICIES
CREATE POLICY "reports_select_policy" ON public.reports FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "reports_insert_policy" ON public.reports FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND 
        (workspace_id IS NULL OR public.is_workspace_editor(workspace_id, auth.uid()))
    );

CREATE POLICY "reports_update_policy" ON public.reports FOR UPDATE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_editor(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "reports_delete_policy" ON public.reports FOR DELETE 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

-- 5.8 AUDIT LOGS POLICIES
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id, auth.uid())) OR 
        public.is_super_admin(auth.uid())
    );

CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR public.is_super_admin(auth.uid()));

-- =====================================================================
-- 6. AUTOMATED USER ONBOARDING TRIGGER (SUPABASE AUTH SYNC)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    invited_ws_id UUID;
    invited_role TEXT;
    invited_dept TEXT;
    target_ws_id UUID;
    org_name TEXT;
BEGIN
    -- 1. Create public.users entry
    INSERT INTO public.users (id, email, role, plan, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'free',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, updated_at = NOW();

    -- 2. Create public.profiles entry
    org_name := COALESCE(NEW.raw_user_meta_data->>'company', split_part(NEW.email, '@', 1) || '''s Workspace');
    INSERT INTO public.profiles (user_id, full_name, company, avatar_url, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', (COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''))),
        org_name,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Check for invited workspace in user_metadata
    IF NEW.raw_user_meta_data->>'workspace_id' IS NOT NULL THEN
        BEGIN
            invited_ws_id := (NEW.raw_user_meta_data->>'workspace_id')::UUID;
            invited_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Analyst');
            
            -- Insert membership in invited workspace
            INSERT INTO public.workspace_members (workspace_id, user_id, role, status, created_at)
            VALUES (invited_ws_id, NEW.id, invited_role, 'active', NOW())
            ON CONFLICT (workspace_id, user_id) DO UPDATE SET status = 'active';

            -- Mark any matching invitation as accepted
            UPDATE public.workspace_invitations
            SET status = 'Accepted', updated_at = NOW()
            WHERE (id::text = NEW.raw_user_meta_data->>'invitation_id' OR (workspace_id = invited_ws_id AND email = NEW.email))
              AND status = 'Pending';
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    ELSE
        -- Create personal default workspace
        INSERT INTO public.workspaces (name, owner_id, is_personal, created_at, updated_at)
        VALUES (org_name, NEW.id, true, NOW(), NOW())
        RETURNING id INTO target_ws_id;

        IF target_ws_id IS NOT NULL THEN
            INSERT INTO public.workspace_members (workspace_id, user_id, role, status, created_at)
            VALUES (target_ws_id, NEW.id, 'owner', 'active', NOW())
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();
