with open("src/components/workspace/StatisticalDiagnosticsView.tsx", "r") as f:
    code = f.read()

# Add a check for activeColStats in the Formula block
code = code.replace(
    "μ = {activeColStats?.mean.toFixed(2) ?? 'N/A'} | σ = {activeColStats?.std.toFixed(2) ?? 'N/A'}",
    "μ = {activeColStats && !isNaN(activeColStats.mean) ? activeColStats.mean.toFixed(2) : 'N/A'} | σ = {activeColStats && !isNaN(activeColStats.std) ? activeColStats.std.toFixed(2) : 'N/A'}"
)

with open("src/components/workspace/StatisticalDiagnosticsView.tsx", "w") as f:
    f.write(code)
