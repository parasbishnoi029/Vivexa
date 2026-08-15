import re

with open('src/pages/workspace/Dashboard.tsx', 'r') as f:
    content = f.read()

# Remove handleSeedSampleDatasets function
content = re.sub(r'// Seed Sample Enterprise Datasets.*?const handleSeedSampleDatasets = async \(\) => \{.*?finally \{\s*setIsSeeding\(false\);\s*\}\s*\};', '', content, flags=re.DOTALL)

# Remove the buttons calling it
# 1. The small one at the top right
btn1 = r'\{recentDatasets\.length === 0 && \(\s*<Button\s*onClick=\{handleSeedSampleDatasets\}\s*disabled=\{isSeeding\}\s*className="h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20"\s*>\s*<Sparkles className="mr-2 h-3\.5 w-3\.5" /> \{isSeeding \? "Seeding\.\.\." : "Load Sample Enterprise Data"\}\s*</Button>\s*\)\}'
content = re.sub(btn1, '', content, flags=re.DOTALL)

# 2. The big one in empty state
btn2 = r'<Button\s*onClick=\{handleSeedSampleDatasets\}\s*disabled=\{isSeeding\}\s*className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider"\s*>\s*<Sparkles className="mr-2 h-4 w-4" /> Load Sample Enterprise Data\s*</Button>'
content = re.sub(btn2, '', content, flags=re.DOTALL)

# Fix paragraph text in empty state
txt = r'Upload your own CSV, Excel, JSON or Parquet files, or load 3 realistic enterprise sample datasets with one click\.'
content = content.replace(txt, 'Upload your own CSV, Excel, JSON or Parquet files to begin your enterprise data journey.')

with open('src/pages/workspace/Dashboard.tsx', 'w') as f:
    f.write(content)

