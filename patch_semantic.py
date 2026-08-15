import re

with open('src/pages/workspace/SemanticLayer.tsx', 'r') as f:
    content = f.read()

# Remove the governance button
content = re.sub(
    r'<Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white rounded-xl">\s*<Shield className="h-4 w-4 mr-2" /> Governance\s*</Button>',
    '',
    content,
    flags=re.MULTILINE
)

# Replace "Governance & Health" with "Health" or something similar if needed, or remove the whole section.
content = content.replace(
    '<h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Governance & Health</h3>',
    '<h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Health Validation</h3>'
)

with open('src/pages/workspace/SemanticLayer.tsx', 'w') as f:
    f.write(content)
