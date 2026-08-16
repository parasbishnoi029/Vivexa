/**
 * DataNormalizationPipelineService.ts
 * 
 * Upgrade 13: Automatic Column Type Coercion & Data Normalization Pipeline
 * Pre-processes raw dataframes/records to normalize headers (snake_case, trimming),
 * clean dirty values (e.g. "$1,200.50" -> 1200.50, "15%" -> 0.15), and standardize dates to ISO 8601.
 * Prevents TypeError, AttributeError, and Pandas aggregation crashes before running queries.
 */

export interface NormalizedDatasetResult {
  records: Record<string, any>[];
  columnTypeMap: Record<string, "numeric" | "datetime" | "categorical" | "boolean">;
  renamedColumnsMap: Record<string, string>; // original -> clean
  coercionSummary: {
    currencyCoercedCount: number;
    percentageCoercedCount: number;
    dateCoercedCount: number;
    nullSanitizedCount: number;
  };
}

export class DataNormalizationPipelineService {
  /**
   * Sanitizes and normalizes raw dataset records and columns.
   */
  public static normalizeDataset(rawRows: Record<string, any>[]): NormalizedDatasetResult {
    if (!rawRows || rawRows.length === 0) {
      return {
        records: [],
        columnTypeMap: {},
        renamedColumnsMap: {},
        coercionSummary: { currencyCoercedCount: 0, percentageCoercedCount: 0, dateCoercedCount: 0, nullSanitizedCount: 0 }
      };
    }

    const originalKeys = Object.keys(rawRows[0]);
    const renamedColumnsMap: Record<string, string> = {};

    // 1. Header normalization: sanitize to snake_case alphanumeric
    originalKeys.forEach((key) => {
      let cleanKey = key
        .trim()
        .toLowerCase()
        .replace(/[\s\-\.]+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      if (!cleanKey || /^[0-9]/.test(cleanKey)) {
        cleanKey = `col_${cleanKey || "val"}`;
      }
      renamedColumnsMap[key] = cleanKey;
    });

    let currencyCoercedCount = 0;
    let percentageCoercedCount = 0;
    let dateCoercedCount = 0;
    let nullSanitizedCount = 0;

    const columnTypeMap: Record<string, "numeric" | "datetime" | "categorical" | "boolean"> = {};
    const cleanKeys = Object.values(renamedColumnsMap);

    // 2. Coerce & sanitize values across all rows
    const normalizedRecords = rawRows.map((row) => {
      const cleanRow: Record<string, any> = {};

      for (const [origKey, cleanKey] of Object.entries(renamedColumnsMap)) {
        let val = row[origKey];

        // Handle Nulls / NaNs
        if (val === null || val === undefined || val === "" || val === "NaN" || val === "null" || val === "None") {
          cleanRow[cleanKey] = null;
          nullSanitizedCount++;
          continue;
        }

        // Boolean check
        if (typeof val === "boolean" || val === "true" || val === "false" || val === "TRUE" || val === "FALSE") {
          cleanRow[cleanKey] = val === true || val === "true" || val === "TRUE";
          columnTypeMap[cleanKey] = "boolean";
          continue;
        }

        // String checks for Currency, Percentage, Dates, Numbers
        if (typeof val === "string") {
          const trimmed = val.trim();

          // Currency string (e.g. "$1,200.50", "€ 450", "-$50.00")
          if (/^[-+]?[\$€£¥₹]?\s*[-+]?[0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?$/.test(trimmed) && /[\$€£¥₹,]/.test(trimmed)) {
            const numVal = parseFloat(trimmed.replace(/[\$€£¥₹,\s]/g, ""));
            if (!isNaN(numVal)) {
              cleanRow[cleanKey] = numVal;
              currencyCoercedCount++;
              columnTypeMap[cleanKey] = "numeric";
              continue;
            }
          }

          // Percentage string (e.g. "15%", "84.5%")
          if (/^[-+]?[0-9]+(\.[0-9]+)?%$/.test(trimmed)) {
            const numVal = parseFloat(trimmed.replace("%", "")) / 100.0;
            if (!isNaN(numVal)) {
              cleanRow[cleanKey] = numVal;
              percentageCoercedCount++;
              columnTypeMap[cleanKey] = "numeric";
              continue;
            }
          }

          // Standard numeric string (e.g. "123.45", "-50")
          if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
            const numVal = parseFloat(trimmed);
            if (!isNaN(numVal)) {
              cleanRow[cleanKey] = numVal;
              columnTypeMap[cleanKey] = "numeric";
              continue;
            }
          }

          // Date format detection (e.g. "2025-01-15", "01/15/2025")
          if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(trimmed) || /^\d{2}[-/]\d{2}[-/]\d{4}/.test(trimmed)) {
            const dateObj = new Date(trimmed);
            if (!isNaN(dateObj.getTime())) {
              cleanRow[cleanKey] = dateObj.toISOString();
              dateCoercedCount++;
              columnTypeMap[cleanKey] = "datetime";
              continue;
            }
          }

          cleanRow[cleanKey] = trimmed;
          columnTypeMap[cleanKey] = "categorical";
        } else if (typeof val === "number") {
          cleanRow[cleanKey] = isNaN(val) ? null : val;
          columnTypeMap[cleanKey] = "numeric";
        } else {
          cleanRow[cleanKey] = val;
        }
      }

      return cleanRow;
    });

    return {
      records: normalizedRecords,
      columnTypeMap,
      renamedColumnsMap,
      coercionSummary: {
        currencyCoercedCount,
        percentageCoercedCount,
        dateCoercedCount,
        nullSanitizedCount
      }
    };
  }

  /**
   * Generates Python DataFrame preprocessing boilerplate code.
   */
  public static getPythonDataCleaningBoilerplate(): string {
    return `
# Automated Python Type Coercion & Header Normalization
import re
import pandas as pd
import numpy as np

def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    # 1. Snake case column headers
    df.columns = [re.sub(r'[^a-zA-Z0-9_]', '', col.strip().lower().replace(' ', '_').replace('-', '_')) for col in df.columns]
    
    # 2. Coerce currency and percentage strings to floats
    for col in df.select_dtypes(include=['object', 'string']).columns:
        # Check if sample strings look like currency
        sample = df[col].dropna().astype(str).head(20)
        if sample.str.contains(r'[$€£,%]').any():
            df[col] = df[col].astype(str).str.replace(r'[$€£,]', '', regex=True)
            df[col] = df[col].str.replace('%', '', regex=True).astype(float, errors='ignore')
    return df
`;
  }
}
