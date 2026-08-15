import re

with open('src/pages/workspace/Automations.tsx', 'r') as f:
    content = f.read()

# Add import for supabase
if 'import { supabase } from "@/lib/supabase";' not in content:
    content = content.replace(
        'import { safeFetchJson } from "@/lib/utils";',
        'import { safeFetchJson } from "@/lib/utils";\nimport { supabase } from "@/lib/supabase";'
    )

# Fix toggleEnable
old_toggle = r"""  const toggleEnable = async \(wf: AutomationRule\) => {
    const newEnabled = !wf.enabled;
    const res = await safeFetchJson\(`/api/v1/automations/\$\{wf.id\}`\, {
      method: "PATCH",
      body: JSON.stringify\({ enabled: newEnabled }\)
    }\);"""
new_toggle = """  const toggleEnable = async (wf: AutomationRule) => {
    const newEnabled = !wf.enabled;
    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${wf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({ enabled: newEnabled })
    });
    const res = await safeFetchJson(req);"""
content = re.sub(old_toggle, new_toggle, content, flags=re.MULTILINE)

# Fix deleteWorkflow
old_delete = r"""  const deleteWorkflow = async \(id: string\) => {
    const res = await safeFetchJson\(`/api/v1/automations/\$\{id\}`\, { method: "DELETE" }\);"""
new_delete = """  const deleteWorkflow = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.access_token}` }
    });
    const res = await safeFetchJson(req);"""
content = re.sub(old_delete, new_delete, content, flags=re.MULTILINE)

# Fix executeNow
old_execute = r"""  const executeNow = async \(wf: AutomationRule\) => {
    setIsExecutingId\(wf.id\);
    toast.info\(`Executing automation workflow "\$\{wf.name\}"\.\.\.`\);
    const res = await safeFetchJson\(`/api/v1/automations/\$\{wf.id\}/execute`\, { method: "POST" }\);"""
new_execute = """  const executeNow = async (wf: AutomationRule) => {
    setIsExecutingId(wf.id);
    toast.info(`Executing automation workflow "${wf.name}"...`);
    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch(`/api/v1/automations/${wf.id}/execute`, { 
      method: "POST",
      headers: { "Authorization": `Bearer ${session?.access_token}` }
    });
    const res = await safeFetchJson(req);"""
content = re.sub(old_execute, new_execute, content, flags=re.MULTILINE)

# Fix handleCreateWorkflow
old_create = r"""    const res = await safeFetchJson\("/api/v1/automations"\, {
      method: "POST",
      body: JSON.stringify\(payload\)
    }\);"""
new_create = """    const { data: { session } } = await supabase.auth.getSession();
    const req = await fetch("/api/v1/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify(payload)
    });
    const res = await safeFetchJson(req);"""
content = re.sub(old_create, new_create, content, flags=re.MULTILINE)

with open('src/pages/workspace/Automations.tsx', 'w') as f:
    f.write(content)
