with open("src/pages/admin/Dashboard.tsx", "r") as f:
    code = f.read()

# Make the dashboard chat input navigate
import re
target = """            <input 
              placeholder="Ask Vivexa AI..." 
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  toast.success("AI is processing your query...");
                }
              }}
            />
            <Button size="icon" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shrink-0 h-9 w-9">
              <Bot className="h-4 w-4" />
            </Button>"""

replacement = """            <input 
              placeholder="Ask Vivexa AI..." 
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = '/workspace/chat';
                }
              }}
            />
            <Button onClick={() => window.location.href = '/workspace/chat'} size="icon" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shrink-0 h-9 w-9">
              <Bot className="h-4 w-4" />
            </Button>"""

if target in code:
    code = code.replace(target, replacement)
else:
    print("Dashboard target not found")

with open("src/pages/admin/Dashboard.tsx", "w") as f:
    f.write(code)
