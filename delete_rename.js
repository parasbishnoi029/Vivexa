import { supabase } from "@/lib/supabase";

async function rename(id, newName) {
   await supabase.from('datasets').update({ name: newName }).eq('id', id);
}

async function remove(id, storagePath) {
   await supabase.from('datasets').delete().eq('id', id);
   await supabase.storage.from('datasets').remove([storagePath]);
}
