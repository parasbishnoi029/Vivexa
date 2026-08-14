import re

with open("src/lib/dataEngine.ts", "r") as f:
    code = f.read()

# I need to accumulate totalDomainInvalidCount across all columns.
# Let's see if totalDomainInvalidCount is calculated.

code = code.replace(
    "let duplicateCount = 0;",
    "let duplicateCount = 0;\n  let totalDomainInvalidCount = 0;"
)

code = code.replace(
    "profile.numericStats = {",
    "totalDomainInvalidCount += domainInvalidCount;\n        profile.numericStats = {"
)

# Now add penalty
target = "const missingPenalty = (overallNullRatio * 250) + (emptyColsRatio * 50);"
replacement = "const domainInvalidRatio = totalDomainInvalidCount / totalRows;\n  const domainPenalty = domainInvalidRatio * 1000; // Heavy penalty for domain invalidity\n  " + target
code = code.replace(target, replacement)

target2 = "const rawQualityScore = 100 - missingPenalty - duplicatePenalty - outlierPenalty - inconsistencyPenalty - skewnessPenalty - cardinalityPenalty - constantPenalty;"
replacement2 = "const rawQualityScore = 100 - missingPenalty - duplicatePenalty - outlierPenalty - inconsistencyPenalty - skewnessPenalty - cardinalityPenalty - constantPenalty - domainPenalty;"
code = code.replace(target2, replacement2)

# update other scores
code = code.replace(
    "let healthScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 150) - (emptyColsRatio * 40) - (overallOutlierRatio * 100) - (duplicateRatio * 100) - constantPenalty)));",
    "let healthScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 150) - (emptyColsRatio * 40) - (overallOutlierRatio * 100) - (duplicateRatio * 100) - constantPenalty - domainPenalty)));"
)

code = code.replace(
    "let consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (duplicateRatio * 50) - (inconsistencyPenalty * 1.8) - skewnessPenalty - (numericCols.length === 0 ? 15 : 0))));",
    "let consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (duplicateRatio * 50) - (inconsistencyPenalty * 1.8) - skewnessPenalty - domainPenalty - (numericCols.length === 0 ? 15 : 0))));"
)

code = code.replace(
    "let mlReadinessScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 200) - (emptyColsRatio * 50) - (duplicateRatio * 150) - cardinalityPenalty - constantPenalty - (numericCols.length < 2 ? 35 : 0))));",
    "let mlReadinessScore = Math.max(0, Math.min(100, Math.round(100 - (overallNullRatio * 200) - (emptyColsRatio * 50) - (duplicateRatio * 150) - cardinalityPenalty - constantPenalty - domainPenalty - (numericCols.length < 2 ? 35 : 0))));"
)

with open("src/lib/dataEngine.ts", "w") as f:
    f.write(code)
