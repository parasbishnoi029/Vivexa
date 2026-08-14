import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching live database metrics...");

  // 1. Users
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  console.log(`\n--- USERS IN 'users' TABLE (${users?.length || 0}) ---`);
  if (uErr) console.error(uErr);
  else console.log(users);

  // 2. Profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log(`\n--- PROFILES (${profiles?.length || 0}) ---`);
  if (pErr) console.error(pErr);
  else console.log(profiles);

  // 3. Workspace members
  const { data: members, error: mErr } = await supabase.from('workspace_members').select('*');
  console.log(`\n--- WORKSPACE MEMBERS (${members?.length || 0}) ---`);
  if (mErr) console.error(mErr);
  else console.log(members);

  // 4. Workspaces
  const { data: workspaces, error: wErr } = await supabase.from('workspaces').select('*');
  console.log(`\n--- WORKSPACES (${workspaces?.length || 0}) ---`);
  if (wErr) console.error(wErr);
  else console.log(workspaces);

  // 5. Organizations
  const { data: organizations, error: oErr } = await supabase.from('organizations').select('*');
  console.log(`\n--- ORGANIZATIONS (${organizations?.length || 0}) ---`);
  if (oErr) console.error(oErr);
  else console.log(organizations);

  // 6. Audit logs
  const { data: auditLogs, error: aErr } = await supabase.from('audit_logs').select('*');
  console.log(`\n--- AUDIT LOGS (${auditLogs?.length || 0}) ---`);
  if (aErr) console.error(aErr);
  else console.log(auditLogs);

  // 7. Projects
  const { data: projects, error: prErr } = await supabase.from('projects').select('*');
  console.log(`\n--- PROJECTS (${projects?.length || 0}) ---`);
  if (prErr) console.error(prErr);
  else console.log(projects);

  // 8. Datasets
  const { data: datasets, error: dErr } = await supabase.from('datasets').select('*');
  console.log(`\n--- DATASETS (${datasets?.length || 0}) ---`);
  if (dErr) console.error(dErr);
  else console.log(datasets);

  // 9. Invitations
  const { data: invitations, error: invErr } = await supabase.from('workspace_invitations').select('*');
  console.log(`\n--- INVITATIONS (${invitations?.length || 0}) ---`);
  if (invErr) console.error(invErr);
  else console.log(invitations);
}

main().catch(console.error);
