import { supabase } from "@/lib/supabase";

export async function diagnoseDatabaseSync() {
  console.log("=== VIVEXA DATABASE DIAGNOSTIC ===");
  
  let profilesCount = 0;
  let membersCount = 0;
  let authUsersCount = 0;

  try {
    const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (!error && count !== null) {
      profilesCount = count;
    }
  } catch (e: any) {
    console.warn("Profiles count fetch error:", e.message);
  }

  try {
    const { count, error } = await supabase.from('workspace_members').select('*', { count: 'exact', head: true });
    if (!error && count !== null) {
      membersCount = count;
    }
  } catch (e: any) {
    console.warn("Workspace members count fetch error:", e.message);
  }

  try {
    const { data, error } = await supabase.rpc('get_auth_users_count');
    if (!error && data !== null) {
      authUsersCount = Number(data);
    }
  } catch {
    authUsersCount = profilesCount;
  }

  const results = {
    auth_users_count: authUsersCount,
    profiles_count: profilesCount,
    workspace_members_count: membersCount,
    discrepancy: Math.abs(authUsersCount - profilesCount),
    timestamp: new Date().toISOString()
  };

  console.log("Diagnostic Results:", results);
  return results;
}
