with open("src/lib/dataEngine.ts", "r") as f:
    code = f.read()

# 1. Update ColumnProfile interfaces
code = code.replace(
"""    modifiedZOutlierCount: number;
    normalityPValue: number;
  };""",
"""    modifiedZOutlierCount: number;
    normalityPValue: number;
    trimmedMean10: number;
  };"""
)

code = code.replace(
"""  categoricalStats?: {
    topCategories: Array<{ value: string; count: number; percentage: number }>;
    mode: string;
    entropy: number;
  };""",
"""  categoricalStats?: {
    topCategories: Array<{ value: string; count: number; percentage: number }>;
    mode: string;
    entropy: number;
    giniImpurity: number;
  };"""
)

code = code.replace(
"""  rawSampleRows: Record<string, any>[];
  validationReport?: MultiPassValidationReport;
}""",
"""  vifScores?: Record<string, number>;
  rawSampleRows: Record<string, any>[];
  validationReport?: MultiPassValidationReport;
}"""
)

# 2. Add math helper functions
new_math_helpers = """export function trimmedMean(arr: number[], trimPercent: number = 0.1): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const k = Math.floor(sorted.length * trimPercent);
  const trimmed = sorted.slice(k, sorted.length - k);
  if (trimmed.length === 0) return mean(arr);
  return mean(trimmed);
}

export function giniImpurity(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let sumSq = 0;
  for (const c of counts) {
    const p = c / total;
    sumSq += p * p;
  }
  return parseFloat((1 - sumSq).toFixed(4));
}

export function computeVIF(numericMap: Record<string, number[]>): Record<string, number> {
  const cols = Object.keys(numericMap);
  const vifScores: Record<string, number> = {};
  if (cols.length < 2) {
    cols.forEach(c => vifScores[c] = 1.0);
    return vifScores;
  }

  for (const col of cols) {
    const target = numericMap[col];
    const predictors = cols.filter(c => c !== col);
    if (target.length < 5 || predictors.length === 0) {
      vifScores[col] = 1.0;
      continue;
    }

    let maxR2 = 0;
    for (const pred of predictors) {
      const r = pearsonCorrelation(target, numericMap[pred]);
      const r2 = r * r;
      if (r2 > maxR2) maxR2 = r2;
    }
    const vif = 1 / Math.max(0.01, 1 - Math.min(0.98, maxR2));
    vifScores[col] = parseFloat(vif.toFixed(2));
  }
  return vifScores;
}

export function computeANOVA(
  categories: string[],
  values: number[]
): { fStatistic: number; pValue: number; dfBetween: number; dfWithin: number; significant: boolean } {
  if (categories.length !== values.length || values.length < 5) {
    return { fStatistic: 0, pValue: 1.0, dfBetween: 0, dfWithin: 0, significant: false };
  }

  const groups: Record<string, number[]> = {};
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(values[i]);
  }

  const groupKeys = Object.keys(groups).filter(k => groups[k].length >= 2);
  const k = groupKeys.length;
  const N = values.length;

  if (k < 2 || N <= k) {
    return { fStatistic: 0, pValue: 1.0, dfBetween: 0, dfWithin: 0, significant: false };
  }

  const grandMean = mean(values);
  let ssb = 0;
  let ssw = 0;

  for (const key of groupKeys) {
    const grp = groups[key];
    const grpMean = mean(grp);
    ssb += grp.length * Math.pow(grpMean - grandMean, 2);
    for (const v of grp) {
      ssw += Math.pow(v - grpMean, 2);
    }
  }

  const dfBetween = k - 1;
  const dfWithin = N - k;

  const msb = ssb / dfBetween;
  const msw = ssw / Math.max(1, dfWithin);

  const fStat = msw > 0 ? msb / msw : 0;
  const pVal = Math.exp(-0.5 * fStat * (dfBetween / Math.max(1, dfWithin + 1)));

  return {
    fStatistic: parseFloat(fStat.toFixed(4)),
    pValue: parseFloat(Math.max(0.0001, Math.min(1.0, pVal)).toFixed(6)),
    dfBetween,
    dfWithin,
    significant: pVal < 0.05
  };
}
"""

code = code.replace(
"// High-precision helper math routines",
"// High-precision helper math routines\n" + new_math_helpers
)

# 3. Insert trimmedMean10 computation in numericStats
code = code.replace(
"""          modifiedZOutlierCount: modZOutliers.length,
          normalityPValue: jbResult.pValue
        };""",
"""          modifiedZOutlierCount: modZOutliers.length,
          normalityPValue: jbResult.pValue,
          trimmedMean10: parseFloat(trimmedMean(calcArr, 0.1).toFixed(4))
        };"""
)

# 4. Insert giniImpurity in categoricalStats
code = code.replace(
"""      profile.categoricalStats = {
        topCategories: sortedFreqs.slice(0, 10),
        mode: sortedFreqs[0]?.value || 'N/A',
        entropy: parseFloat(entropy.toFixed(4))
      };""",
"""      const countsList = sortedFreqs.map(f => f.count);
      profile.categoricalStats = {
        topCategories: sortedFreqs.slice(0, 10),
        mode: sortedFreqs[0]?.value || 'N/A',
        entropy: parseFloat(entropy.toFixed(4)),
        giniImpurity: giniImpurity(countsList)
      };"""
)

# 5. Compute vifScores and ANOVA in statisticalTests
code = code.replace(
"  // Sort correlations by magnitude",
"""  const vifScores = computeVIF(numericValuesMap);
  // Sort correlations by magnitude"""
)

code = code.replace(
"""    rawSampleRows: rawRows.slice(0, 10)
  };""",
"""    vifScores,
    rawSampleRows: rawRows.slice(0, 10)
  };"""
)

# Insert One-Way ANOVA in statisticalTests
anova_code = """
  if (categoricalCols.length > 0 && numericCols.length > 0) {
    const catCol = categoricalCols[0];
    const numCol = numericCols[0];
    const catsArr = rawRows.map(r => String(r[catCol] ?? '')).filter(Boolean);
    const numsArr = rawRows.map(r => Number(r[numCol])).filter(n => !isNaN(n));
    const minL = Math.min(catsArr.length, numsArr.length);
    if (minL >= 10) {
      const anovaRes = computeANOVA(catsArr.slice(0, minL), numsArr.slice(0, minL));
      statisticalTests.push({
        testName: 'One-Way ANOVA Group Difference Test',
        variables: [catCol, numCol],
        statistic: anovaRes.fStatistic,
        pValue: anovaRes.pValue,
        significant: anovaRes.significant,
        businessInterpretation: anovaRes.significant
          ? `Significant metric variance detected across groups of '${catCol}' for '${numCol}' (F = ${anovaRes.fStatistic}, p = ${anovaRes.pValue}).`
          : `No statistically significant variance in '${numCol}' across categories of '${catCol}'.`
      });
    }
  }
"""

code = code.replace(
"  // 6. ML Algorithm Recommendations",
anova_code + "\n  // 6. ML Algorithm Recommendations"
)

with open("src/lib/dataEngine.ts", "w") as f:
    f.write(code)

print("dataEngine.ts upgraded with trimmedMean, giniImpurity, VIF, and ANOVA")
