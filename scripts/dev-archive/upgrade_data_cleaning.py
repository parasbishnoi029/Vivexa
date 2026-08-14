with open("src/lib/dataCleaning.ts", "r") as f:
    code = f.read()

# 1. Update CleaningOptions interface
target_opts = "missingValueStrategy: 'auto' | 'mean' | 'median' | 'mode' | 'ffill' | 'bfill' | 'drop_rows' | 'drop_cols';"
replacement_opts = "missingValueStrategy: 'auto' | 'mean' | 'median' | 'mode' | 'ffill' | 'bfill' | 'interpolate' | 'drop_rows' | 'drop_cols';"
code = code.replace(target_opts, replacement_opts)

# 2. Add linear interpolation & feature scaling logic
target_missing_end = """      transformationsApplied.push(`Applied Backward Fill imputation on column '${c}'`);
      continue;
    }"""

replacement_missing_end = """      transformationsApplied.push(`Applied Backward Fill imputation on column '${c}'`);
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
    }"""

code = code.replace(target_missing_end, replacement_missing_end)

# 3. Add Feature Scaling step before calculate final nulls
target_outlier_end = """      transformationsApplied.push(`Added outlier indicator binary column '${flagCol}'`);
    }
  }"""

replacement_outlier_end = """      transformationsApplied.push(`Added outlier indicator binary column '${flagCol}'`);
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
  }"""

code = code.replace(target_outlier_end, replacement_outlier_end)

with open("src/lib/dataCleaning.ts", "w") as f:
    f.write(code)

print("dataCleaning.ts upgraded successfully")
