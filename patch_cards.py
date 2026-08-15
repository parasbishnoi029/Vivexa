import re

with open('src/pages/workspace/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace top KPI cards
def wrap_card(m):
    return f'<motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="h-full">\n          {m.group(0)}\n          </motion.div>'

content = re.sub(
    r'(<Card\s+onClick=\{\(\) => navigate\([^)]+\)\}\s+className="bg-slate-900/50 border-slate-800/80 hover:border-[^"]+ transition-all cursor-pointer group rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl"\s*>.*?</Card>)',
    wrap_card,
    content,
    flags=re.DOTALL
)

with open('src/pages/workspace/Dashboard.tsx', 'w') as f:
    f.write(content)
