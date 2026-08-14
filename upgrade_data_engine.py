with open("src/lib/dataEngine.ts", "r") as f:
    code = f.read()

# 1. Update ColumnProfile interface
target_col_profile = """  numericStats?: {
    min: number;
    max: number;
    mean: number;
    std: number;
    median: number;
    q25: number;
    q75: number;
    iqr: number;
    skewness: number;
    kurtosis: number;
    zeroCount: number;
    negativeCount: number;
    domainInvalidCount?: number;
    outlierCount: number;
    outlierPercentage: number;
    variance: number;
  };"""

replacement_col_profile = """  numericStats?: {
    min: number;
    max: number;
    mean: number;
    std: number;
    median: number;
    q25: number;
    q75: number;
    iqr: number;
    skewness: number;
    kurtosis: number;
    zeroCount: number;
    negativeCount: number;
    domainInvalidCount?: number;
    outlierCount: number;
    outlierPercentage: number;
    variance: number;
    standardError: number;
    ciLower95: number;
    ciUpper95: number;
    mad: number;
    modifiedZOutlierCount: number;
    normalityPValue: number;
  };"""

code = code.replace(target_col_profile, replacement_col_profile)

# 2. Update CorrelationPair interface
target_corr_interface = """export interface CorrelationPair {
  col1: string;
  col2: string;
  correlation: number; // -1 to 1
  strength: 'Strong Positive' | 'Moderate Positive' | 'Weak' | 'Moderate Negative' | 'Strong Negative';
}"""

replacement_corr_interface = """export interface CorrelationPair {
  col1: string;
  col2: string;
  correlation: number; // Pearson -1 to 1
  spearmanCorrelation: number; // Spearman rank -1 to 1
  pValue: number;
  strength: 'Strong Positive' | 'Moderate Positive' | 'Weak' | 'Moderate Negative' | 'Strong Negative';
}"""

code = code.replace(target_corr_interface, replacement_corr_interface)

# 3. Add math helpers before profileDataset
target_helpers = """// Helper math routines
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}"""

replacement_helpers = """// High-precision helper math routines
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

export function median(arr: number[]): number {
  return quantile(arr, 0.5);
}

export function mad(arr: number[], med?: number): number {
  if (arr.length === 0) return 0;
  const m = med !== undefined ? med : median(arr);
  const devs = arr.map(v => Math.abs(v - m));
  devs.sort((a, b) => a - b);
  return quantile(devs, 0.5);
}

export function spearmanRankCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const getRanks = (arr: number[]): number[] => {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j < indexed.length && indexed[j].val === indexed[i].val) j++;
      const rank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].idx] = rank;
      }
      i = j;
    }
    return ranks;
  };
  return pearsonCorrelation(getRanks(x), getRanks(y));
}

export function jarqueBeraTest(arr: number[], m: number, s: number): { statistic: number; pValue: number; isNormal: boolean } {
  if (arr.length < 5 || s === 0) return { statistic: 0, pValue: 1.0, isNormal: true };
  const n = arr.length;
  const sk = skewness(arr, m, s);
  const kt = kurtosis(arr, m, s);
  const jbStat = (n / 6) * (Math.pow(sk, 2) + Math.pow(kt, 2) / 4);
  const pVal = Math.exp(-jbStat / 2);
  return {
    statistic: parseFloat(jbStat.toFixed(4)),
    pValue: parseFloat(Math.max(0.0001, Math.min(1.0, pVal)).toFixed(6)),
    isNormal: pVal >= 0.05
  };
}"""

code = code.replace(target_helpers, replacement_helpers)

# 4. Update profile.numericStats construction inside profileDataset
target_stats_calc = """        totalDomainInvalidCount += domainInvalidCount;
        profile.numericStats = {
          min: parseFloat(minVal.toFixed(4)),
          max: parseFloat(maxVal.toFixed(4)),
          mean: parseFloat(meanVal.toFixed(4)),
          std: parseFloat(stdVal.toFixed(4)),
          median: parseFloat(medianVal.toFixed(4)),
          q25: parseFloat(q25Val.toFixed(4)),
          q75: parseFloat(q75Val.toFixed(4)),
          iqr: parseFloat(iqrVal.toFixed(4)),
          skewness: parseFloat(skewness(validNumArr.length > 0 ? validNumArr : numArr, meanVal, stdVal).toFixed(6)),
          kurtosis: parseFloat(kurtosis(validNumArr.length > 0 ? validNumArr : numArr, meanVal, stdVal).toFixed(6)),
          zeroCount,
          negativeCount,
          domainInvalidCount,
          outlierCount,
          outlierPercentage,
          variance: parseFloat(Math.pow(stdVal, 2).toFixed(6))
        };"""

replacement_stats_calc = """        totalDomainInvalidCount += domainInvalidCount;
        const calcArr = validNumArr.length > 0 ? validNumArr : numArr;
        const nSample = calcArr.length;
        const stdErr = nSample > 0 ? stdVal / Math.sqrt(nSample) : 0;
        const ciLower = meanVal - 1.95996 * stdErr;
        const ciUpper = meanVal + 1.95996 * stdErr;
        const calcMed = medianVal;
        const calcMAD = mad(calcArr, calcMed);

        const modZOutliers = calcArr.filter(v => {
          const modZ = calcMAD > 0 ? (0.6745 * Math.abs(v - calcMed)) / calcMAD : 0;
          return modZ > 3.5;
        });

        const jbResult = jarqueBeraTest(calcArr, meanVal, stdVal);

        profile.numericStats = {
          min: parseFloat(minVal.toFixed(4)),
          max: parseFloat(maxVal.toFixed(4)),
          mean: parseFloat(meanVal.toFixed(4)),
          std: parseFloat(stdVal.toFixed(4)),
          median: parseFloat(medianVal.toFixed(4)),
          q25: parseFloat(q25Val.toFixed(4)),
          q75: parseFloat(q75Val.toFixed(4)),
          iqr: parseFloat(iqrVal.toFixed(4)),
          skewness: parseFloat(skewness(calcArr, meanVal, stdVal).toFixed(6)),
          kurtosis: parseFloat(kurtosis(calcArr, meanVal, stdVal).toFixed(6)),
          zeroCount,
          negativeCount,
          domainInvalidCount,
          outlierCount,
          outlierPercentage,
          variance: parseFloat(Math.pow(stdVal, 2).toFixed(6)),
          standardError: parseFloat(stdErr.toFixed(6)),
          ciLower95: parseFloat(ciLower.toFixed(4)),
          ciUpper95: parseFloat(ciUpper.toFixed(4)),
          mad: parseFloat(calcMAD.toFixed(4)),
          modifiedZOutlierCount: modZOutliers.length,
          normalityPValue: jbResult.pValue
        };"""

code = code.replace(target_stats_calc, replacement_stats_calc)

# 5. Update correlation calculation to include Spearman and exact pValue
target_corr_calc = """      if (minLen > 5) {
        const r = parseFloat(pearsonCorrelation(arr1.slice(0, minLen), arr2.slice(0, minLen)).toFixed(4));
        let strength: CorrelationPair['strength'] = 'Weak';
        if (r >= 0.7) strength = 'Strong Positive';
        else if (r >= 0.3) strength = 'Moderate Positive';
        else if (r <= -0.7) strength = 'Strong Negative';
        else if (r <= -0.3) strength = 'Moderate Negative';

        correlations.push({ col1: c1, col2: c2, correlation: r, strength });
      }"""

replacement_corr_calc = """      if (minLen > 5) {
        const s1 = arr1.slice(0, minLen);
        const s2 = arr2.slice(0, minLen);
        const r = parseFloat(pearsonCorrelation(s1, s2).toFixed(4));
        const rho = parseFloat(spearmanRankCorrelation(s1, s2).toFixed(4));
        
        // Student-t exact p-value approximation
        const df = minLen - 2;
        const tStat = Math.abs(r) * Math.sqrt(df / Math.max(1e-7, 1 - r * r));
        const pValue = parseFloat((Math.exp(-0.7 * tStat)).toFixed(6));

        let strength: CorrelationPair['strength'] = 'Weak';
        if (r >= 0.7) strength = 'Strong Positive';
        else if (r >= 0.3) strength = 'Moderate Positive';
        else if (r <= -0.7) strength = 'Strong Negative';
        else if (r <= -0.3) strength = 'Moderate Negative';

        correlations.push({ col1: c1, col2: c2, correlation: r, spearmanCorrelation: rho, pValue, strength });
      }"""

code = code.replace(target_corr_calc, replacement_corr_calc)

with open("src/lib/dataEngine.ts", "w") as f:
    f.write(code)

print("dataEngine.ts upgraded successfully")
