with open("src/lib/analysisValidator.ts", "r") as f:
    code = f.read()

# Replace .toFixed(2) with .toFixed(4) in analysisValidator.ts
code = code.replace(".toFixed(2)", ".toFixed(4)")

with open("src/lib/analysisValidator.ts", "w") as f:
    f.write(code)

print("analysisValidator.ts updated with 4 decimal precision")
