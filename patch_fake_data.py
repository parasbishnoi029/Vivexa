import re
import os

# 1. Automations.tsx
automations_path = 'src/pages/workspace/Automations.tsx'
with open(automations_path, 'r') as f:
    content = f.read()
# Replace DEFAULT_AUTOMATIONS
content = re.sub(r'const DEFAULT_AUTOMATIONS: AutomationRule\[\] = \[.*?\];', 'const DEFAULT_AUTOMATIONS: AutomationRule[] = [];', content, flags=re.DOTALL)
with open(automations_path, 'w') as f:
    f.write(content)

# 2. DecisionIntelligence.tsx
di_path = 'src/pages/workspace/DecisionIntelligence.tsx'
with open(di_path, 'r') as f:
    content = f.read()
content = re.sub(r'const DEFAULT_ENTERPRISE_DATASETS = \[.*?\];', 'const DEFAULT_ENTERPRISE_DATASETS: any[] = [];', content, flags=re.DOTALL)
with open(di_path, 'w') as f:
    f.write(content)

# 3. Lakehouse.tsx
lh_path = 'src/pages/workspace/Lakehouse.tsx'
with open(lh_path, 'r') as f:
    content = f.read()
content = re.sub(r'const DEFAULT_ASSETS: LakehouseAsset\[\] = \[.*?\];', 'const DEFAULT_ASSETS: LakehouseAsset[] = [];', content, flags=re.DOTALL)
content = re.sub(r'const SAMPLE_QUERIES: Record<string, SampleQuery\[\]> = \{.*?\};', 'const SAMPLE_QUERIES: Record<string, SampleQuery[]> = {};', content, flags=re.DOTALL)
with open(lh_path, 'w') as f:
    f.write(content)

# 4. workspaceStore.ts
ws_path = 'src/stores/workspaceStore.ts'
with open(ws_path, 'r') as f:
    content = f.read()
content = re.sub(r'const DEFAULT_NOTEBOOKS: Notebook\[\] = \[.*?\];', 'const DEFAULT_NOTEBOOKS: Notebook[] = [];', content, flags=re.DOTALL)
with open(ws_path, 'w') as f:
    f.write(content)

print("Removed fake data from Automations, DecisionIntelligence, Lakehouse, and workspaceStore")
