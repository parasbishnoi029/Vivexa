with open("src/pages/workspace/Dashboard.tsx", "r") as f:
    code = f.read()

code = code.replace("navigate(`/workspace/ai?q=${encodeURIComponent(chatQuery)}`);", "navigate(`/workspace/ai/chat?q=${encodeURIComponent(chatQuery)}`);")

with open("src/pages/workspace/Dashboard.tsx", "w") as f:
    f.write(code)
