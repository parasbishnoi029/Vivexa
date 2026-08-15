import re

with open('src/pages/workspace/Dashboard.tsx', 'r') as f:
    content = f.read()

def wrap_dataset_card(m):
    return f'<motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">\n                {m.group(0)}\n                </motion.div>'

content = re.sub(
    r'(<Card key=\{ds\.id \|\| i\} className="bg-slate-900/50 border-slate-800/80 hover:border-cyan-500/50 transition-all rounded-2xl p-5 space-y-4 backdrop-blur-xl group">.*?</Card>)',
    wrap_dataset_card,
    content,
    flags=re.DOTALL
)

with open('src/pages/workspace/Dashboard.tsx', 'w') as f:
    f.write(content)
