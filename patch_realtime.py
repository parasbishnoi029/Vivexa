import re

with open('src/hooks/useWorkspaceRealtime.ts', 'r') as f:
    content = f.read()

content = content.replace('25000', '60000')

with open('src/hooks/useWorkspaceRealtime.ts', 'w') as f:
    f.write(content)
