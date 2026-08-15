import re

with open('src/pages/workspace/Automations.tsx', 'r') as f:
    content = f.read()

old_delete = r"""    const res = await safeFetchJson\(`/api/v1/automations/\$\{id\}`\, { method: "DELETE" }\);"""
new_delete = """    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.access_token}` }
    });
    const res = await safeFetchJson(req);"""
content = re.sub(old_delete, new_delete, content, flags=re.MULTILINE)

with open('src/pages/workspace/Automations.tsx', 'w') as f:
    f.write(content)
