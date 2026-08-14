import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export async function syncUserAndWorkspace(user: User) {
  if (!user || !user.id) return;

  try {
    const fullName = user.user_metadata?.full_name || 
      (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : user.email?.split('@')[0] || 'User');

    // 1. Sync public.users (primary user record)
    const { data: existingUsers } = await supabase.from('users').select('id').eq('id', user.id).limit(1);
    if (!existingUsers || existingUsers.length === 0) {
      const { error: userErr } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email || '',
        role: 'user',
        plan: 'free',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (userErr) {
        console.warn("syncUserAndWorkspace user upsert note:", userErr.message);
      }
    }

    // 2. Sync public.profiles
    const { data: existingProfiles } = await supabase.from('profiles').select('id, user_id').eq('user_id', user.id).limit(1);
    if (!existingProfiles || existingProfiles.length === 0) {
      const { error: profileErr } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || '',
        company: user.user_metadata?.company || `${user.email?.split('@')[0] || 'User'}'s Workspace`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (profileErr) {
        console.warn("syncUserAndWorkspace profile upsert note:", profileErr.message);
      }
    }

    // 3. Sync public.workspaces (Prevent duplicate personal workspaces)
    let workspaceId: string | null = null;
    const { data: existingWorkspaces, error: selectErr } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .eq('is_personal', true)
      .order('created_at', { ascending: true });

    if (Array.isArray(existingWorkspaces) && existingWorkspaces.length > 0) {
      workspaceId = existingWorkspaces[0].id;
    } else if (!selectErr) {
      const wsName = user.user_metadata?.company || `${user.email?.split('@')[0] || 'User'}'s Workspace`;
      const { data: newWs, error: wsErr } = await supabase.from('workspaces').insert({
        name: wsName,
        owner_id: user.id,
        is_personal: true
      }).select('id');

      if (newWs && newWs.length > 0) {
        workspaceId = newWs[0].id;
      } else if (wsErr) {
        console.warn("syncUserAndWorkspace workspace insert note:", wsErr.message);
      }
    } else {
      console.warn("syncUserAndWorkspace select error:", selectErr.message);
    }

    // 4. Sync workspace_members
    if (workspaceId) {
      const { data: existingMembers } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .limit(1);

      if (!existingMembers || existingMembers.length === 0) {
        try {
          await supabase.from('workspace_members').insert({
            workspace_id: workspaceId,
            user_id: user.id,
            role: 'owner'
          });
        } catch (_) {}
      }
    }

    // 5. Sync subscriptions
    const { data: existingSubs } = await supabase.from('subscriptions').select('id').eq('user_id', user.id).limit(1);
    if (!existingSubs || existingSubs.length === 0) {
      try {
        await supabase.from('subscriptions').insert({
          user_id: user.id,
          plan_id: 'free',
          status: 'active',
          current_period_end: new Date(Date.now() + 365*24*60*60*1000).toISOString()
        });
      } catch (_) {}
    }

    // 6. Sync settings
    const { data: existingSettings } = await supabase.from('settings').select('id').eq('user_id', user.id).limit(1);
    if (!existingSettings || existingSettings.length === 0) {
      try {
        await supabase.from('settings').insert({
          user_id: user.id,
          theme: 'dark',
          email_notifications: true
        });
      } catch (_) {}
    }
  } catch (err) {
    console.error("Error in syncUserAndWorkspace:", err);
  }
}

