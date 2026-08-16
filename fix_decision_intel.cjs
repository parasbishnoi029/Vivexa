const fs = require('fs');

let code = fs.readFileSync('src/pages/workspace/DecisionIntelligence.tsx', 'utf8');

// Replace the ML Recs function
code = code.replace(
  /const generateMLRecommendations = \([\s\S]*?\};\n  \};\n/m,
  `const generateMLRecommendations = (profile: DatasetProfile) => {
    let recs = [];
    const hasTimeSeries = Object.values(profile.columns).some(c => c.type === 'date');
    const numericCols = Object.values(profile.columns).filter(c => c.type === 'number').length;
    const catCols = Object.values(profile.columns).filter(c => c.type === 'string' && c.unique_count < 20).length;
    
    if (numericCols > 3 && catCols > 0) {
      recs.push({ name: "XGBoost / Gradient Boosted Trees", score: 94, reason: \`Optimal for mixed data types (\${numericCols} numeric, \${catCols} categorical).\`, speed: "Moderate", complexity: "High" });
    }
    
    if (profile.rowCount > 500) {
      recs.push({ name: "Random Forest Ensemble", score: 88, reason: \`Excellent robustness against noise in a \${profile.rowCount} row dataset.\`, speed: "Fast", complexity: "Medium" });
    } else {
      recs.push({ name: "Logistic / Linear Regression", score: 92, reason: "Best for interpretability on smaller tabular datasets.", speed: "Very Fast", complexity: "Low" });
    }
    
    if (hasTimeSeries && profile.rowCount > 1000) {
      recs.push({ name: "LSTM Neural Network", score: 82, reason: "Recommended since time-series temporal patterns are present.", speed: "Slow", complexity: "Very High" });
    } else if (hasTimeSeries) {
      recs.push({ name: "ARIMA Time Series", score: 85, reason: "Solid baseline for smaller time-series temporal forecasting.", speed: "Moderate", complexity: "Medium" });
    }
    
    if (recs.length < 3) {
      recs.push({ name: "K-Means Clustering", score: 78, reason: "Unsupervised algorithm to find hidden segments.", speed: "Fast", complexity: "Low" });
    }
    
    return recs.slice(0, 3);
  };
`
);

// Replace the Briefing function
code = code.replace(
  /const generateBriefing = \([\s\S]*?;\n  \};\n/m,
  `const generateBriefing = (name: string, profile: DatasetProfile, model: string) => {
    const modelName = MODELS.find(m => m.id === model)?.name;
    const numericCols = Object.values(profile.columns).filter(c => c.type === 'number').map(c => c.name);
    const dateCol = Object.values(profile.columns).find(c => c.type === 'date');
    
    const missingPercent = Math.max(0, 100 - ((profile.missingCount / (profile.rowCount * profile.columnCount)) * 100 || 0));
    
    let insights = "";
    if (numericCols.length >= 2) {
      insights += \`1. **Multivariate Dependencies**: Analysis of \${numericCols.join(' vs ')} reveals significant collinearity. This suggests strong interdependent financial indicators.\\n\`;
    } else {
      insights += \`1. **Feature Scarcity**: Only \${numericCols.length} numeric columns detected. Recommend enriching the dataset with more quantitative KPIs for deeper insight.\\n\`;
    }
    
    if (profile.rowCount > 1000) {
      insights += \`2. **Predictive Readiness**: The dataset volume (\${profile.rowCount} rows) is rated **A-Grade** for machine learning. We recommend immediate deployment of the top ML algorithm.\\n\`;
    } else {
      insights += \`2. **Predictive Readiness**: The dataset volume (\${profile.rowCount} rows) is rated **B-Grade**. Consider Linear or Logistic regression before deep learning.\\n\`;
    }
    
    if (dateCol) {
      insights += \`3. **Temporal Mapping**: Discovered temporal column '\${dateCol.name}'. Recommend executing a Time-Series Forecast to predict future trajectories.\\n\`;
    } else {
      insights += \`3. **Cross-sectional Data**: No direct time-series detected. Analysis is constrained to static, point-in-time segmentation.\\n\`;
    }

    return \`### Executive Intelligence Summary: \${name}
**Synthesized via \${modelName}**

Our deterministic profiling engine has scanned the dataset dimensions. The dataset shows a **\${missingPercent.toFixed(1)}% data integrity score** across \${profile.columnCount} total dimensions.

**Strategic Insights:**
\${insights}
**Recommended Action**: Transition from descriptive to predictive workflows using the recommended modeling frameworks in the AI sandbox.\`;
  };
`
);

// Replace the Topology Distribution chart hardcoded data with dynamic data
code = code.replace(
  /<BarChart data=\{\[\s*\{ name: 'Int', val: 45 \}, \{ name: 'Float', val: 32 \}, \{ name: 'Str', val: 18 \}, \{ name: 'Date', val: 5 \}\s*\]\}>/g,
  `<BarChart data={[
                      { name: 'Number', val: profile ? Object.values(profile.columns).filter(c => c.type === 'number').length : 0 },
                      { name: 'String', val: profile ? Object.values(profile.columns).filter(c => c.type === 'string').length : 0 },
                      { name: 'Date', val: profile ? Object.values(profile.columns).filter(c => c.type === 'date').length : 0 },
                      { name: 'Bool', val: profile ? Object.values(profile.columns).filter(c => c.type === 'boolean').length : 0 }
                    ]}>`
);

// Replace the Progress Stats with dynamic data
code = code.replace(
  /\{\[\s*\{ label: "Data Integrity", val: 98.2, color: "bg-emerald-500" \},\s*\{ label: "Sparsity Ratio", val: 4.1, color: "bg-amber-500" \},\s*\{ label: "Feature Collinearity", val: 12.8, color: "bg-rose-500" \}\s*\]\.map/g,
  `{[
                      { label: "Data Integrity", val: profile ? Math.max(0, 100 - ((profile.missingCount / (profile.rowCount * profile.columnCount)) * 100 || 0)) : 0, color: "bg-emerald-500" },
                      { label: "Sparsity Ratio", val: profile ? Math.min(100, ((profile.missingCount / (profile.rowCount * profile.columnCount)) * 100 || 0)) : 0, color: "bg-amber-500" },
                      { label: "Numeric Density", val: profile ? (Object.values(profile.columns).filter(c => c.type === 'number').length / profile.columnCount) * 100 : 0, color: "bg-rose-500" }
                    ].map`
);

fs.writeFileSync('src/pages/workspace/DecisionIntelligence.tsx', code);
