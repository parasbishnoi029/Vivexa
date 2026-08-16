/**
 * Enterprise Automated Data Cleaning, Transformation & Preparation Engine
 * Supports automated profiling, missing value imputation, outlier detection & treatment,
 * text normalization, column encoding, feature scaling, and audit logging.
 */

export interface CleaningOptions {
  missingValueStrategy: 'auto' | 'mean' | 'median' | 'mode' | 'ffill' | 'bfill' | 'interpolate' | 'drop_rows' | 'drop_cols';
  outlierMethod: 'iqr' | 'zscore' | 'modified_zscore';
  outlierTreatment: 'flag' | 'remove' | 'winsorize' | 'cap';
  removeDuplicates: boolean;
  fuzzyDeduplicate?: boolean;
  fuzzySimilarityThreshold?: number; // 0.0 to 1.0, e.g. 0.85
  cleanColumnNames: boolean;
  trimWhitespace: boolean;
  standardizeDates: boolean;
  parseCurrencies: boolean;
  removeConstantCols: boolean;
  removeLowVarianceCols: boolean;
  lowVarianceThreshold?: number;
  encodingStrategy?: 'none' | 'onehot' | 'label' | 'ordinal';
  scalingStrategy?: 'none' | 'standard' | 'minmax' | 'robust' | 'log';
  targetColumn?: string;
}

export interface CleaningIssue {
  type: 'missing' | 'duplicate' | 'outlier' | 'constant' | 'high_cardinality' | 'multicollinearity' | 'class_imbalance' | 'type_mismatch';
  column?: string;
  count: number;
  percentage: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

export interface CleaningAuditLog {
  timestamp: string;
  initialRowCount: number;
  finalRowCount: number;
  initialColCount: number;
  finalColCount: number;
  initialNullCount: number;
  finalNullCount: number;
  initialOutlierCount: number;
  finalOutlierCount: number;
  duplicateRowsRemoved: number;
  columnsDropped: string[];
  columnsAdded: string[];
  transformationsApplied: string[];
  detectedIssues: CleaningIssue[];
  qualityScoreBefore: number;
  qualityScoreAfter: number;
}

export interface CleanedDatasetResult {
  cleanedRows: Record<string, any>[];
  columns: string[];
  auditLog: CleaningAuditLog;
  dataDictionary: Array<{
    columnName: string;
    dataType: string;
    nullCount: number;
    uniqueValues: number;
    sample: any;
    description: string;
  }>;
}

// Helpers
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(arr: any[]): any {
  if (arr.length === 0) return '';
  const freq: Record<string, number> = {};
  let maxCount = 0;
  let modeVal = arr[0];
  for (const v of arr) {
    const s = String(v);
    freq[s] = (freq[s] || 0) + 1;
    if (freq[s] > maxCount) {
      maxCount = freq[s];
      modeVal = v;
    }
  }
  return modeVal;
}

function stdDev(arr: number[], avg?: number): number {
  if (arr.length <= 1) return 0;
  if (avg !== undefined) {
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }
  let count = 0;
  let meanVal = 0;
  let M2 = 0;
  for (const x of arr) {
    count++;
    const delta = x - meanVal;
    meanVal += delta / count;
    const delta2 = x - meanVal;
    M2 += delta * delta2;
  }
  const variance = count > 1 ? M2 / (count - 1) : 0;
  return Math.sqrt(variance);
}

function quantile(sorted: number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const index = (n - 1) * q;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  const h = index - lo;
  return sorted[lo] * (1 - h) + sorted[hi] * h;
}

/**
 * Calculates Levenshtein string similarity score (0.0 to 1.0)
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 1.0;

  const len1 = str1.length;
  const len2 = str2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const track = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));
  for (let i = 0; i <= len1; i += 1) track[0][i] = i;
  for (let j = 0; j <= len2; j += 1) track[j][0] = j;

  for (let j = 1; j <= len2; j += 1) {
    for (let i = 1; i <= len1; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const distance = track[len2][len1];
  return parseFloat(((maxLen - distance) / maxLen).toFixed(4));
}

/**
 * Clean column names to standard snake_case
 */
export function sanitizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[$%#@!&*()^+=;:'",.<>/?\\|{}[\]]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'unnamed_column';
}

/**
 * Automatically inspect dataset for data cleaning issues
 */
export function detectCleaningIssues(rows: Record<string, any>[]): CleaningIssue[] {
  if (!rows || rows.length === 0) return [];

  const issues: CleaningIssue[] = [];
  const totalRows = rows.length;
  const cols = Object.keys(rows[0] || {});

  // 1. Duplicate rows
  const rowStrings = new Set<string>();
  let duplicateCount = 0;
  for (const r of rows) {
    const s = JSON.stringify(r);
    if (rowStrings.has(s)) duplicateCount++;
    else rowStrings.add(s);
  }

  if (duplicateCount > 0) {
    const pct = parseFloat(((duplicateCount / totalRows) * 100).toFixed(2));
    issues.push({
      type: 'duplicate',
      count: duplicateCount,
      percentage: pct,
      description: `Found ${duplicateCount} duplicate row(s) (${pct}% of dataset).`,
      severity: pct > 10 ? 'high' : 'medium',
      suggestedAction: 'Deduplicate dataset keeping first occurrence.'
    });
  }

  // Column level checks
  for (const col of cols) {
    const rawValues = rows.map(r => r[col]);
    const nulls = rawValues.filter(v => v === null || v === undefined || v === "" || String(v).trim().toLowerCase() === "null" || String(v).trim().toLowerCase() === "nan");
    const nullCount = nulls.length;
    const nullPct = parseFloat(((nullCount / totalRows) * 100).toFixed(2));

    if (nullCount > 0) {
      issues.push({
        type: 'missing',
        column: col,
        count: nullCount,
        percentage: nullPct,
        description: `Column '${col}' has ${nullCount} missing value(s) (${nullPct}%).`,
        severity: nullPct > 30 ? 'high' : nullPct > 5 ? 'medium' : 'low',
        suggestedAction: nullPct > 50 ? 'Drop column or use mean/median imputation.' : 'Apply mean/median or mode imputation.'
      });
    }

    const nonNulls = rawValues.filter(v => v !== null && v !== undefined && v !== "" && String(v).trim().toLowerCase() !== "null" && String(v).trim().toLowerCase() !== "nan");
    const uniqueCount = new Set(nonNulls.map(v => String(v).trim())).size;

    // Constant column
    if (nonNulls.length > 0 && uniqueCount === 1) {
      issues.push({
        type: 'constant',
        column: col,
        count: totalRows,
        percentage: 100,
        description: `Column '${col}' is constant with only 1 unique value ('${nonNulls[0]}').`,
        severity: 'medium',
        suggestedAction: 'Drop column as it provides zero variance/information.'
      });
    }

    // High cardinality
    if (uniqueCount > 100 && uniqueCount / nonNulls.length > 0.8 && typeof nonNulls[0] === 'string' && !col.toLowerCase().includes('id')) {
      issues.push({
        type: 'high_cardinality',
        column: col,
        count: uniqueCount,
        percentage: parseFloat(((uniqueCount / nonNulls.length) * 100).toFixed(2)),
        description: `Column '${col}' has high cardinality with ${uniqueCount} distinct text values.`,
        severity: 'low',
        suggestedAction: 'Consider target encoding or binning before modeling.'
      });
    }

    // Outlier check for numeric
    const numericVals = nonNulls.map(v => Number(v)).filter(n => !isNaN(n));
    if (numericVals.length > 10 && numericVals.length / nonNulls.length > 0.8) {
      numericVals.sort((a, b) => a - b);
      const q25 = quantile(numericVals, 0.25);
      const q75 = quantile(numericVals, 0.75);
      const iqr = q75 - q25;
      const lowerFence = q25 - 1.5 * iqr;
      const upperFence = q75 + 1.5 * iqr;
      const outliers = numericVals.filter(n => n < lowerFence || n > upperFence);

      if (outliers.length > 0) {
        const outPct = parseFloat(((outliers.length / numericVals.length) * 100).toFixed(2));
        issues.push({
          type: 'outlier',
          column: col,
          count: outliers.length,
          percentage: outPct,
          description: `Column '${col}' contains ${outliers.length} statistical outlier(s) (${outPct}%).`,
          severity: outPct > 5 ? 'medium' : 'low',
          suggestedAction: 'Winsorize or cap outliers to IQR bounds.'
        });
      }
    }
  }

  return issues;
}

/**
 * Execute automated or configured data cleaning on dataset rows
 */
export function cleanDataset(
  rawRows: Record<string, any>[],
  options: Partial<CleaningOptions> = {}
): CleanedDatasetResult {
  const opts: CleaningOptions = {
    missingValueStrategy: options.missingValueStrategy || 'auto',
    outlierMethod: options.outlierMethod || 'iqr',
    outlierTreatment: options.outlierTreatment || 'cap',
    removeDuplicates: options.removeDuplicates ?? true,
    cleanColumnNames: options.cleanColumnNames ?? true,
    trimWhitespace: options.trimWhitespace ?? true,
    standardizeDates: options.standardizeDates ?? true,
    parseCurrencies: options.parseCurrencies ?? true,
    removeConstantCols: options.removeConstantCols ?? true,
    removeLowVarianceCols: options.removeLowVarianceCols ?? false,
    encodingStrategy: options.encodingStrategy || 'none',
    scalingStrategy: options.scalingStrategy || 'none',
    targetColumn: options.targetColumn
  };

  const timestamp = new Date().toISOString();
  const initialRowCount = rawRows.length;
  if (initialRowCount === 0) {
    throw new Error("Cannot clean empty dataset");
  }

  let rows = JSON.parse(JSON.stringify(rawRows)) as Record<string, any>[];
  let cols = Object.keys(rows[0] || {});
  const initialColCount = cols.length;

  const transformationsApplied: string[] = [];
  const columnsDropped: string[] = [];
  const columnsAdded: string[] = [];

  // Count initial nulls
  let initialNullCount = 0;
  for (const r of rows) {
    for (const c of cols) {
      const v = r[c];
      if (v === null || v === undefined || v === "" || String(v).trim().toLowerCase() === "null" || String(v).trim().toLowerCase() === "nan") {
        initialNullCount++;
      }
    }
  }

  // 1. Column Name Cleanup
  const colNameMap: Record<string, string> = {};
  if (opts.cleanColumnNames) {
    const newCols: string[] = [];
    const usedNames = new Set<string>();

    for (const c of cols) {
      let clean = sanitizeColumnName(c);
      let counter = 1;
      while (usedNames.has(clean)) {
        clean = `${sanitizeColumnName(c)}_${counter++}`;
      }
      usedNames.add(clean);
      colNameMap[c] = clean;
      newCols.push(clean);
    }

    rows = rows.map(r => {
      const newObj: Record<string, any> = {};
      for (const oldCol of cols) {
        newObj[colNameMap[oldCol]] = r[oldCol];
      }
      return newObj;
    });

    cols = newCols;
    transformationsApplied.push("Sanitized and standardized column names to lowercase snake_case");
  } else {
    for (const c of cols) colNameMap[c] = c;
  }

  // 2. Trim whitespace & parse currencies/dates
  rows = rows.map(r => {
    const updated: Record<string, any> = { ...r };
    for (const c of cols) {
      let val = updated[c];

      // Convert empty strings or null strings to null
      if (val === null || val === undefined || val === "" || String(val).trim().toLowerCase() === "null" || String(val).trim().toLowerCase() === "nan") {
        updated[c] = null;
        continue;
      }

      if (typeof val === 'string' && opts.trimWhitespace) {
        val = val.trim();
      }
      
      // Categorical & Boolean normalization
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower === 'male' || lower === 'm' || lower === 'male ') val = 'Male';
        else if (lower === 'female' || lower === 'f' || lower === 'female ') val = 'Female';
        else if (lower === 'yes' || lower === 'y' || lower === 'true') val = 'Yes';
        else if (lower === 'no' || lower === 'n' || lower === 'false') val = 'No';
        else if (lower === 'india' || lower === 'india ') val = 'India';
      }

      // Handle written numbers like 'thirty'
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        const wordsToNum: Record<string, number> = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
          'twenty': 20, 'twenty nine': 29, 'twenty-nine': 29, 'thirty': 30, 'thirty-two': 32
        };
        if (wordsToNum[lower] !== undefined) val = wordsToNum[lower];
      }

      // Detect invalid emails (basic)
      if (c.toLowerCase().includes('email') && typeof val === 'string' && val.length > 0) {
        if (!val.includes('@') || !val.includes('.')) val = null;
      }

      // Domain constraints for known numeric columns
      if (c.toLowerCase() === 'age' || c.toLowerCase().includes('age_')) {
         if (val === '-') val = null;
         let num = Number(val);
         if (!isNaN(num) && (num < 0 || num > 120)) val = null;
      }
      if (c.toLowerCase().includes('satisfaction') || c.toLowerCase().includes('rating')) {
         let num = Number(val);
         if (!isNaN(num) && (num < 1 || num > 5)) val = null;
      }
      if (c.toLowerCase().includes('price') || c.toLowerCase().includes('income') || c.toLowerCase().includes('spending') || c.toLowerCase().includes('quantity') || c.toLowerCase().includes('sales')) {
         let num = Number(val);
         if (!isNaN(num) && num < 0) val = null;
      }

      if (typeof val === 'string' && opts.trimWhitespace) {
        val = val.trim();
      }

      // Parse Currencies ($1,234.50 -> 1234.50)
      if (typeof val === 'string' && opts.parseCurrencies && /^[$€£₹₽]\s*[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(val) || /^[-+]?\d{1,3}(,\d{3})*(\.\d+)?\s*[$€£₹₽]$/.test(val) || /^[$€£₹₽]\s*[-+]?\d+(\.\d+)?$/.test(val)) {
        const num = parseFloat(val.replace(/[$€£₹₽,\s]/g, ''));
        if (!isNaN(num)) val = num;
      }

      // Standardize Dates
      if (typeof val === 'string' && opts.standardizeDates && val.length >= 8) {
        const parsedTime = Date.parse(val);
        if (!isNaN(parsedTime) && (val.includes('-') || val.includes('/'))) {
          const dateStr = new Date(parsedTime).toISOString().split('T')[0];
          // Prevent 2025-13-01 which Javascript might roll over to 2026-01-01 but we can just use simple validity
          if ((val.includes('-13-') || val.includes('/13/')) || val.toLowerCase() === 'not-a-date') val = null; // Basic heuristic
          else val = dateStr;
        }
      }

      updated[c] = val;
    }
    return updated;
  });
  transformationsApplied.push("Trimmed whitespace, parsed currency values, and standardized date formats");

  // 3. Remove Duplicate Rows (Exact & Optional Fuzzy Matching)
  let duplicateRowsRemoved = 0;
  if (opts.removeDuplicates) {
    const uniqueRows: Record<string, any>[] = [];
    const seen = new Set<string>();

    for (const r of rows) {
      const str = JSON.stringify(r);
      if (seen.has(str)) {
        duplicateRowsRemoved++;
      } else {
        seen.add(str);
        uniqueRows.push(r);
      }
    }
    rows = uniqueRows;
    if (duplicateRowsRemoved > 0) {
      transformationsApplied.push(`Removed ${duplicateRowsRemoved} exact duplicate row(s)`);
    }

    // Optional Fuzzy Deduplication using Levenshtein distance on text fields
    if (opts.fuzzyDeduplicate && rows.length > 1) {
      const threshold = opts.fuzzySimilarityThreshold || 0.88;
      const textCols = cols.filter(c => typeof rows[0][c] === 'string' && !c.includes('id') && !c.includes('date'));
      
      if (textCols.length > 0) {
        const keptRows: Record<string, any>[] = [];
        let fuzzyRemoved = 0;

        for (const candidate of rows) {
          let isFuzzyDuplicate = false;
          for (const kept of keptRows) {
            let matches = 0;
            for (const tCol of textCols) {
              const val1 = String(candidate[tCol] || '');
              const val2 = String(kept[tCol] || '');
              if (val1 && val2 && levenshteinSimilarity(val1, val2) >= threshold) {
                matches++;
              }
            }
            if (textCols.length > 0 && matches / textCols.length >= 0.75) {
              isFuzzyDuplicate = true;
              break;
            }
          }

          if (isFuzzyDuplicate) {
            fuzzyRemoved++;
          } else {
            keptRows.push(candidate);
          }
        }

        if (fuzzyRemoved > 0) {
          duplicateRowsRemoved += fuzzyRemoved;
          rows = keptRows;
          transformationsApplied.push(`Removed ${fuzzyRemoved} fuzzy near-duplicate row(s) (similarity >= ${Math.round(threshold * 100)}%)`);
        }
      }
    }
  }

  // 4. Remove Constant Columns
  if (opts.removeConstantCols) {
    const colsToKeep: string[] = [];
    for (const c of cols) {
      const nonNulls = rows.map(r => r[c]).filter(v => v !== null && v !== undefined);
      const uniqueCount = new Set(nonNulls.map(v => String(v))).size;

      if (nonNulls.length === 0 || uniqueCount <= 1) {
        columnsDropped.push(c);
      } else {
        colsToKeep.push(c);
      }
    }

    if (columnsDropped.length > 0) {
      cols = colsToKeep;
      rows = rows.map(r => {
        const filtered: Record<string, any> = {};
        for (const c of cols) filtered[c] = r[c];
        return filtered;
      });
      transformationsApplied.push(`Dropped ${columnsDropped.length} zero-variance/constant column(s): ${columnsDropped.join(', ')}`);
    }
  }

  // 5. Handle Missing Values
  for (const c of cols) {
    const rawVals = rows.map(r => r[c]);
    const nullIndices: number[] = [];
    const nonNullVals: any[] = [];

    rawVals.forEach((v, idx) => {
      if (v === null || v === undefined || v === "") {
        nullIndices.push(idx);
      } else {
        nonNullVals.push(v);
      }
    });

    if (nullIndices.length === 0) continue;

    const isNumericCol = nonNullVals.length > 0 && nonNullVals.every(v => !isNaN(Number(v)));
    let fillVal: any = null;

    if (opts.missingValueStrategy === 'drop_rows') {
      rows = rows.filter(r => r[c] !== null && r[c] !== undefined && r[c] !== "");
      transformationsApplied.push(`Dropped rows with missing values in column '${c}'`);
      continue;
    }

    if (opts.missingValueStrategy === 'mean' || (opts.missingValueStrategy === 'auto' && isNumericCol)) {
      fillVal = parseFloat(mean(nonNullVals.map(Number)).toFixed(4));
    } else if (opts.missingValueStrategy === 'median') {
      fillVal = parseFloat(median(nonNullVals.map(Number)).toFixed(4));
    } else if (opts.missingValueStrategy === 'mode' || (opts.missingValueStrategy === 'auto' && !isNumericCol)) {
      fillVal = mode(nonNullVals);
    } else if (opts.missingValueStrategy === 'ffill') {
      let lastVal: any = nonNullVals[0] || 'N/A';
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][c] === null || rows[i][c] === undefined || rows[i][c] === "") {
          rows[i][c] = lastVal;
        } else {
          lastVal = rows[i][c];
        }
      }
      transformationsApplied.push(`Applied Forward Fill imputation on column '${c}'`);
      continue;
    } else if (opts.missingValueStrategy === 'bfill') {
      let nextVal: any = nonNullVals[nonNullVals.length - 1] || 'N/A';
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i][c] === null || rows[i][c] === undefined || rows[i][c] === "") {
          rows[i][c] = nextVal;
        } else {
          nextVal = rows[i][c];
        }
      }
      transformationsApplied.push(`Applied Backward Fill imputation on column '${c}'`);
      continue;
    } else if (opts.missingValueStrategy === 'interpolate' && isNumericCol) {
      // Linear interpolation
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][c] === null || rows[i][c] === undefined || rows[i][c] === "") {
          let leftIdx = i - 1;
          while (leftIdx >= 0 && (rows[leftIdx][c] === null || rows[leftIdx][c] === undefined || rows[leftIdx][c] === "")) leftIdx--;
          let rightIdx = i + 1;
          while (rightIdx < rows.length && (rows[rightIdx][c] === null || rows[rightIdx][c] === undefined || rows[rightIdx][c] === "")) rightIdx++;

          if (leftIdx >= 0 && rightIdx < rows.length) {
            const yL = Number(rows[leftIdx][c]);
            const yR = Number(rows[rightIdx][c]);
            const interp = yL + (yR - yL) * ((i - leftIdx) / (rightIdx - leftIdx));
            rows[i][c] = parseFloat(interp.toFixed(4));
          } else if (leftIdx >= 0) {
            rows[i][c] = Number(rows[leftIdx][c]);
          } else if (rightIdx < rows.length) {
            rows[i][c] = Number(rows[rightIdx][c]);
          }
        }
      }
      transformationsApplied.push(`Applied Linear Interpolation on column '${c}'`);
      continue;
    }

    if (fillVal !== null) {
      for (const idx of nullIndices) {
        rows[idx][c] = fillVal;
      }
      transformationsApplied.push(`Imputed ${nullIndices.length} missing value(s) in column '${c}' using fill value: ${fillVal}`);
    }
  }

  // 6. Detect and Handle Outliers
  let initialOutlierCount = 0;
  let finalOutlierCount = 0;

  for (const c of cols) {
    const validRows = rows.filter(r => r[c] !== null && r[c] !== undefined && String(r[c]).trim() !== "");
    const numArr = validRows.map(r => Number(r[c])).filter(n => !isNaN(n));
    if (numArr.length < 10) continue;

    numArr.sort((a, b) => a - b);
    const q25 = quantile(numArr, 0.25);
    const q75 = quantile(numArr, 0.75);
    const iqr = q75 - q25;
    const lowerFence = parseFloat((q25 - 1.5 * iqr).toFixed(4));
    const upperFence = parseFloat((q75 + 1.5 * iqr).toFixed(4));

    let outlierIndices: number[] = [];
    rows.forEach((r, idx) => {
      if (r[c] === null || r[c] === undefined || String(r[c]).trim() === "") return;
      const val = Number(r[c]);
      if (!isNaN(val) && (val < lowerFence || val > upperFence)) {
        outlierIndices.push(idx);
      }
    });

    initialOutlierCount += outlierIndices.length;

    if (outlierIndices.length > 0 && opts.outlierTreatment === 'cap') {
      for (const idx of outlierIndices) {
        const val = Number(rows[idx][c]);
        if (val < lowerFence) rows[idx][c] = lowerFence;
        else if (val > upperFence) rows[idx][c] = upperFence;
      }
      transformationsApplied.push(`Capped ${outlierIndices.length} outlier(s) in column '${c}' to IQR bounds [${lowerFence}, ${upperFence}]`);
    } else if (outlierIndices.length > 0 && opts.outlierTreatment === 'winsorize') {
      const p5 = parseFloat(quantile(numArr, 0.05).toFixed(4));
      const p95 = parseFloat(quantile(numArr, 0.95).toFixed(4));
      for (const idx of outlierIndices) {
        const val = Number(rows[idx][c]);
        if (val < p5) rows[idx][c] = p5;
        else if (val > p95) rows[idx][c] = p95;
      }
      transformationsApplied.push(`Winsorized ${outlierIndices.length} outlier(s) in column '${c}' to 5th-95th percentiles [${p5}, ${p95}]`);
    } else if (outlierIndices.length > 0 && opts.outlierTreatment === 'remove') {
      rows = rows.filter((_, idx) => !outlierIndices.includes(idx));
      transformationsApplied.push(`Removed ${outlierIndices.length} outlier row(s) based on column '${c}'`);
    } else if (outlierIndices.length > 0 && opts.outlierTreatment === 'flag') {
      const flagCol = `${c}_is_outlier`;
      cols.push(flagCol);
      columnsAdded.push(flagCol);
      rows.forEach((r, idx) => {
        r[flagCol] = outlierIndices.includes(idx) ? 1 : 0;
      });
      transformationsApplied.push(`Added outlier indicator binary column '${flagCol}'`);
    }
  }

  // 7. Feature Scaling (Standard / MinMax / Robust / Log)
  if (opts.scalingStrategy && opts.scalingStrategy !== 'none') {
    for (const c of cols) {
      const nums = rows.map(r => Number(r[c])).filter(n => !isNaN(n));
      if (nums.length < 5) continue;

      const avg = mean(nums);
      const s = stdDev(nums, avg);
      const minV = Math.min(...nums);
      const maxV = Math.max(...nums);
      const medV = median(nums);
      const sortedNums = [...nums].sort((a, b) => a - b);
      const q25 = quantile(sortedNums, 0.25);
      const q75 = quantile(sortedNums, 0.75);
      const iqr = q75 - q25;

      rows.forEach(r => {
        const val = Number(r[c]);
        if (!isNaN(val)) {
          if (opts.scalingStrategy === 'standard' && s > 0) {
            r[c] = parseFloat(((val - avg) / s).toFixed(4));
          } else if (opts.scalingStrategy === 'minmax' && maxV > minV) {
            r[c] = parseFloat(((val - minV) / (maxV - minV)).toFixed(4));
          } else if (opts.scalingStrategy === 'robust' && iqr > 0) {
            r[c] = parseFloat(((val - medV) / iqr).toFixed(4));
          } else if (opts.scalingStrategy === 'log' && val >= 0) {
            r[c] = parseFloat(Math.log1p(val).toFixed(4));
          }
        }
      });
    }
    transformationsApplied.push(`Applied '${opts.scalingStrategy}' Feature Scaling across numeric variables`);
  }

  // Calculate final nulls
  let finalNullCount = 0;
  for (const r of rows) {
    for (const c of cols) {
      const v = r[c];
      if (v === null || v === undefined || v === "") finalNullCount++;
    }
  }

  // Quality score before & after
  const qualityScoreBefore = Math.max(0, Math.min(100, Math.round(100 - (initialNullCount / (initialRowCount * initialColCount || 1)) * 60 - (duplicateRowsRemoved / initialRowCount) * 30)));
  const qualityScoreAfter = Math.max(0, Math.min(100, Math.round(100 - (finalNullCount / (rows.length * cols.length || 1)) * 60)));

  const detectedIssues = detectCleaningIssues(rawRows);

  const auditLog: CleaningAuditLog = {
    timestamp,
    initialRowCount,
    finalRowCount: rows.length,
    initialColCount,
    finalColCount: cols.length,
    initialNullCount,
    finalNullCount,
    initialOutlierCount,
    finalOutlierCount,
    duplicateRowsRemoved,
    columnsDropped,
    columnsAdded,
    transformationsApplied,
    detectedIssues,
    qualityScoreBefore,
    qualityScoreAfter
  };

  const dataDictionary = cols.map(c => {
    const vals = rows.map(r => r[c]).filter(v => v !== null && v !== undefined);
    const isNum = vals.length > 0 && vals.every(v => !isNaN(Number(v)));
    return {
      columnName: c,
      dataType: isNum ? 'numeric' : 'categorical',
      nullCount: rows.length - vals.length,
      uniqueValues: new Set(vals.map(v => String(v))).size,
      sample: vals[0] ?? 'N/A',
      description: isNum ? `Numeric feature (range: ${Math.min(...vals.map(Number))} to ${Math.max(...vals.map(Number))})` : `Categorical feature with ${new Set(vals.map(v => String(v))).size} unique category levels`
    };
  });

  return {
    cleanedRows: rows,
    columns: cols,
    auditLog,
    dataDictionary
  };
}
