with open("src/pages/workspace/AIChat.tsx", "r") as f:
    code = f.read()

target = """  const [input, setInput] = useState("");
  const initialQuery = searchParams.get('q');

  useEffect(() => {
    if (initialQuery && !isStreaming) {
      // Clear the q param so we don't re-trigger on remount
      window.history.replaceState({}, document.title, window.location.pathname + location.search.replace(/q=[^&]+&?/, ''));
      setTimeout(() => handleSend(initialQuery), 500);
    }
  }, [initialQuery]);

  const [isStreaming, setIsStreaming] = useState(false);"""

replacement = """  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const initialQuery = searchParams.get('q');

  useEffect(() => {
    if (initialQuery && !isStreaming) {
      // Clear the q param so we don't re-trigger on remount
      window.history.replaceState({}, document.title, window.location.pathname + location.search.replace(/q=[^&]+&?/, ''));
      setTimeout(() => handleSend(initialQuery), 500);
    }
  }, [initialQuery]);"""

code = code.replace(target, replacement)

with open("src/pages/workspace/AIChat.tsx", "w") as f:
    f.write(code)
