with open("src/pages/workspace/AIAnalyst.tsx", "r") as f:
    code = f.read()

# Add useSearchParams import if missing
if "useSearchParams" not in code:
    code = code.replace('import { useState', 'import { useState, useEffect } from "react";\nimport { useSearchParams }')

# Inside AIAnalyst function:
target = """  const [isSidebarOpen, setIsSidebarOpen] = useState(true);"""
replacement = """  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      // Wait for state to settle then submit
      setTimeout(() => {
        handleAnalyze(q);
      }, 500);
      setSearchParams({}); // Clear it
    }
  }, []);"""

if target in code:
    code = code.replace(target, replacement)
else:
    print("Target not found in AIAnalyst")

# We need handleAnalyze to take an optional query arg
target_analyze = """  const handleAnalyze = async () => {
    if (!query.trim() || isAnalyzing) return;"""
replacement_analyze = """  const handleAnalyze = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim() || isAnalyzing) return;"""

if target_analyze in code:
    code = code.replace(target_analyze, replacement_analyze)
    # Also we need to replace all `query` usages inside handleAnalyze with `q`
    # Let's just do a simple replace inside the function body
    pass

with open("src/pages/workspace/AIAnalyst.tsx", "w") as f:
    f.write(code)
