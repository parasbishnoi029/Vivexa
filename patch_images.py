import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If <img doesn't have loading="lazy", add it
    # We do a simple regex: find <img without loading attribute
    
    def repl(m):
        tag = m.group(0)
        if 'loading=' not in tag:
            # insert loading="lazy" right after <img
            return tag.replace('<img', '<img loading="lazy"')
        return tag
    
    new_content = re.sub(r'<img[^>]+>', repl, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
            process_file(os.path.join(root, file))
