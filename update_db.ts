import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function updateDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Running enterprise RLS policies & schema migration...');

    const migrationSql = `
      -- 1. Ensure columns exist
      ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
      ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
      ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

      -- 2. Backfill existing data workspace_id from project_id if null
      UPDATE public.projects p
      SET workspace_id = (SELECT id FROM public.workspaces w WHERE w.owner_id = p.owner_id ORDER BY w.created_at ASC LIMIT 1)
      WHERE p.workspace_id IS NULL;

      UPDATE public.datasets d
      SET workspace_id = COALESCE(
          (SELECT p.workspace_id FROM public.projects p WHERE p.id = d.project_id),
          (SELECT id FROM public.workspaces w WHERE w.owner_id = d.user_id ORDER BY w.created_at ASC LIMIT 1)
      )
      WHERE d.workspace_id IS NULL;

      UPDATE public.reports r
      SET workspace_id = COALESCE(
          (SELECT p.workspace_id FROM public.projects p WHERE p.id = r.project_id),
          (SELECT id FROM public.workspaces w WHERE w.owner_id = r.user_id ORDER BY w.created_at ASC LIMIT 1)
      )
      WHERE r.workspace_id IS NULL;

      UPDATE public.ai_conversations c
      SET workspace_id = COALESCE(
          (SELECT id FROM public.workspaces w WHERE w.owner_id = c.user_id ORDER BY w.created_at ASC LIMIT 1)
      )
      WHERE c.workspace_id IS NULL;

      -- 3. DROP old restrictive select policies
      DROP POLICY IF EXISTS "Workspaces viewable by owner" ON public.workspaces;
      DROP POLICY IF EXISTS "Workspaces updateable by owner" ON public.workspaces;
      DROP POLICY IF EXISTS "Workspaces deleteable by owner" ON public.workspaces;

      DROP POLICY IF EXISTS "Projects viewable by owner" ON public.projects;
      DROP POLICY IF EXISTS "Projects insertable by owner" ON public.projects;
      DROP POLICY IF EXISTS "Projects updateable by owner" ON public.projects;
      DROP POLICY IF EXISTS "Projects deleteable by owner" ON public.projects;

      DROP POLICY IF EXISTS "Datasets viewable by owner" ON public.datasets;
      DROP POLICY IF EXISTS "Datasets insertable by owner" ON public.datasets;
      DROP POLICY IF EXISTS "Datasets updateable by owner" ON public.datasets;
      DROP POLICY IF EXISTS "Datasets deleteable by owner" ON public.datasets;

      DROP POLICY IF EXISTS "Reports viewable by owner" ON public.reports;
      DROP POLICY IF EXISTS "Reports insertable by owner" ON public.reports;
      DROP POLICY IF EXISTS "Reports updateable by owner" ON public.reports;
      DROP POLICY IF EXISTS "Reports deleteable by owner" ON public.reports;

      DROP POLICY IF EXISTS "AI Conversations viewable by owner" ON public.ai_conversations;
      DROP POLICY IF EXISTS "AI Conversations manageable by owner" ON public.ai_conversations;

      -- 4. CREATE new collaborative RLS policies (allow owner OR workspace members)
      -- Workspaces SELECT
      CREATE POLICY "Workspaces viewable by owner or members" ON public.workspaces FOR SELECT USING (
          auth.uid() = owner_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = id AND workspace_members.user_id = auth.uid()) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Workspaces UPDATE
      CREATE POLICY "Workspaces updateable by owner or admin" ON public.workspaces FOR UPDATE USING (
          auth.uid() = owner_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Workspaces DELETE
      CREATE POLICY "Workspaces deleteable by owner" ON public.workspaces FOR DELETE USING (
          auth.uid() = owner_id OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Projects SELECT
      CREATE POLICY "Projects collaborative view" ON public.projects FOR SELECT USING (
          auth.uid() = owner_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid()) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Projects INSERT
      CREATE POLICY "Projects collaborative insert" ON public.projects FOR INSERT WITH CHECK (
          auth.uid() = owner_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager', 'Analyst'))
      );

      -- Projects UPDATE
      CREATE POLICY "Projects collaborative update" ON public.projects FOR UPDATE USING (
          auth.uid() = owner_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager', 'Analyst')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Projects DELETE
      CREATE POLICY "Projects collaborative delete" ON public.projects FOR DELETE USING (
          auth.uid() = owner_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Datasets SELECT
      CREATE POLICY "Datasets collaborative view" ON public.datasets FOR SELECT USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid()) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Datasets INSERT
      CREATE POLICY "Datasets collaborative insert" ON public.datasets FOR INSERT WITH CHECK (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager', 'Analyst'))
      );

      -- Datasets UPDATE
      CREATE POLICY "Datasets collaborative update" ON public.datasets FOR UPDATE USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager', 'Analyst')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Datasets DELETE
      CREATE POLICY "Datasets collaborative delete" ON public.datasets FOR DELETE USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Reports SELECT
      CREATE POLICY "Reports collaborative view" ON public.reports FOR SELECT USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid()) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Reports INSERT
      CREATE POLICY "Reports collaborative insert" ON public.reports FOR INSERT WITH CHECK (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager', 'Analyst'))
      );

      -- Reports UPDATE
      CREATE POLICY "Reports collaborative update" ON public.reports FOR UPDATE USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager', 'Analyst')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Reports DELETE
      CREATE POLICY "Reports collaborative delete" ON public.reports FOR DELETE USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('Owner', 'Admin', 'Manager')) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- AI Conversations SELECT & MANAGE
      CREATE POLICY "Conversations collaborative view" ON public.ai_conversations FOR SELECT USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid()) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      CREATE POLICY "Conversations collaborative manage" ON public.ai_conversations FOR ALL USING (
          auth.uid() = user_id OR
          EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_members.workspace_id = workspace_id AND workspace_members.user_id = auth.uid()) OR
          (auth.jwt() ->> 'email') IN ('parasbishnoi012@gmail.com', 'info.vivexa@gmail.com')
      );

      -- Reload schemas
      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(migrationSql);
    console.log('Database schemas and collaborative RLS policies updated successfully.');

    await client.end();
  } catch (err) {
    console.error('Error updating database schema:', err);
    process.exit(1);
  }
}

updateDb();
