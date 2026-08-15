import re

# Observability
f1 = 'src/pages/workspace/Observability.tsx'
with open(f1, 'r') as f:
    c = f.read()
c = re.sub(r'const CPU_METRICS_DATA = \[.*?\];', 'const CPU_METRICS_DATA: any[] = [];', c, flags=re.DOTALL)
with open(f1, 'w') as f:
    f.write(c)

# Organization
f2 = 'src/pages/workspace/Organization.tsx'
with open(f2, 'r') as f:
    c = f.read()
c = re.sub(r'export const DEPT_DATA = \[.*?\];', 'export const DEPT_DATA: any[] = [];', c, flags=re.DOTALL)
with open(f2, 'w') as f:
    f.write(c)

# GlobalSearch
f3 = 'src/pages/workspace/GlobalSearch.tsx'
with open(f3, 'r') as f:
    c = f.read()
c = re.sub(r'const DATASET_COLUMN_INDEX: SearchHit\[\] = \[.*?\];', 'const DATASET_COLUMN_INDEX: SearchHit[] = [];', c, flags=re.DOTALL)
with open(f3, 'w') as f:
    f.write(c)

