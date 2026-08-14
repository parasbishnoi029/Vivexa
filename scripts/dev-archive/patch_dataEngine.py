with open("src/lib/dataEngine.ts", "r") as f:
    code = f.read()

code = code.replace(
    "negativeCount: number;",
    "negativeCount: number;\n    domainInvalidCount?: number;"
)

if "domainInvalidCount," not in code:
    code = code.replace(
        "negativeCount,\n          outlierCount",
        "negativeCount,\n          domainInvalidCount,\n          outlierCount"
    )

with open("src/lib/dataEngine.ts", "w") as f:
    f.write(code)
