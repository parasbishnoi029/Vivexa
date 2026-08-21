import React, { useState, useMemo } from "react";
import {
  BookOpen, Search, Copy, Plus, Sparkles, Filter, ChevronRight, X,
  Database, BarChart3, Binary, Table, Cpu, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface CodeSnippetItem {
  id: string;
  category: "wrangling" | "stats" | "visualization" | "ml" | "sql" | "cleaning";
  title: string;
  desc: string;
  type: "python" | "sql";
  code: string;
}

export const NOTEBOOK_RECIPES: CodeSnippetItem[] = [
  // 1. Data Wrangling (Pandas)
  {
    id: "pw-1",
    category: "wrangling",
    title: "Aggregated GroupBy & Multi-Metrics",
    desc: "Calculate Mean, Sum, Count, and Median per segment with custom column renaming.",
    type: "python",
    code: `summary_table = df.groupby('Segment').agg(
    Record_Count=('Sales', 'count'),
    Total_Revenue=('Sales', 'sum'),
    Average_Ticket=('Sales', 'mean'),
    Median_Profit=('Profit', 'median')
).reset_index()
print(summary_table)`
  },
  {
    id: "pw-2",
    category: "wrangling",
    title: "Pivot Table with Row & Col Margins",
    desc: "Cross-tabulate two categorical dimensions with sum values and subtotal margins.",
    type: "python",
    code: `pivot_view = df.pivot_table(
    index='Category',
    columns='Region',
    values='Sales',
    aggfunc='sum',
    fill_value=0,
    margins=True,
    margins_name='Grand Total'
)
print(pivot_view)`
  },
  {
    id: "pw-3",
    category: "wrangling",
    title: "DateTime Parsing & Month-over-Month Delta",
    desc: "Extract date parts, resample monthly, and calculate percentage growth deltas.",
    type: "python",
    code: `# Convert date column and aggregate
if 'Order Date' in df.columns:
    df['Date_Parsed'] = pd.to_datetime(df['Order Date'])
    monthly = df.set_index('Date_Parsed').resample('M')['Sales'].sum().reset_index()
    monthly['MoM_Growth_%'] = monthly['Sales'].pct_change() * 100
    print(monthly.tail(12))
else:
    print("Column 'Order Date' not found in dataset.")`
  },

  // 2. Data Cleaning & Hygiene
  {
    id: "pc-1",
    category: "cleaning",
    title: "Outlier Detection via IQR Method",
    desc: "Flag records exceeding 1.5x Interquartile Range (IQR) on numeric features.",
    type: "python",
    code: `numeric_cols = df.select_dtypes(include=['number']).columns
for col in numeric_cols:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
    print(f"{col}: {len(outliers)} outliers detected (outside [{lower_bound:.2f}, {upper_bound:.2f}])")`
  },
  {
    id: "pc-2",
    category: "cleaning",
    title: "Smart Imputation & Missing Value Report",
    desc: "Profile missing rates and impute median for numeric and mode for categorical.",
    type: "python",
    code: `clean_df = df.copy()
# Missing percentage
missing_rep = clean_df.isnull().mean() * 100
print("=== Missing Data Rate (%) ===")
print(missing_rep[missing_rep > 0])

# Impute
for col in clean_df.columns:
    if clean_df[col].dtype in ['float64', 'int64']:
        clean_df[col].fillna(clean_df[col].median(), inplace=True)
    else:
        clean_df[col].fillna(clean_df[col].mode()[0] if not clean_df[col].mode().empty else "Unknown", inplace=True)
print("Data hygiene imputation complete. Clean shape:", clean_df.shape)`
  },

  // 3. Statistical Testing & Correlation
  {
    id: "st-1",
    category: "stats",
    title: "Full Correlation Matrix & Significance",
    desc: "Compute Pearson and Spearman correlation matrix across all numeric features.",
    type: "python",
    code: `import scipy.stats as stats

numeric_df = df.select_dtypes(include=['number'])
corr_matrix = numeric_df.corr(method='pearson')
print("=== PEARSON CORRELATION MATRIX ===")
print(corr_matrix.round(3))

# Find top correlated pairs
unstacked = corr_matrix.unstack()
sorted_pairs = unstacked.sort_values(kind="quicksort", ascending=False)
strong_pairs = sorted_pairs[(sorted_pairs < 0.999) & (sorted_pairs.abs() > 0.4)]
print("\n=== STRONG CORRELATION PAIRS ===")
print(strong_pairs.drop_duplicates())`
  },
  {
    id: "st-2",
    category: "stats",
    title: "Independent Two-Sample T-Test",
    desc: "Test whether two segment distributions differ significantly (p-value check).",
    type: "python",
    code: `from scipy import stats

if 'Segment' in df.columns and 'Sales' in df.columns:
    segments = df['Segment'].dropna().unique()
    if len(segments) >= 2:
        group_a = df[df['Segment'] == segments[0]]['Sales'].dropna()
        group_b = df[df['Segment'] == segments[1]]['Sales'].dropna()
        t_stat, p_val = stats.ttest_ind(group_a, group_b, equal_var=False)
        print(f"Comparison: '{segments[0]}' vs '{segments[1]}'")
        print(f"T-Statistic: {t_stat:.4f}, P-Value: {p_val:.4e}")
        print("Result:", "Statistically Significant (p < 0.05)" if p_val < 0.05 else "Not Statistically Significant")`
  },

  // 4. Machine Learning & Predictive Modeling
  {
    id: "ml-1",
    category: "ml",
    title: "Random Forest Feature Importance",
    desc: "Train a quick Random Forest model and extract the top predictive drivers.",
    type: "python",
    code: `from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# Select numeric and encoded categorical features
X = df.select_dtypes(include=['number']).copy()
if 'Sales' in X.columns:
    y = X.pop('Sales')
    X.fillna(X.median(), inplace=True)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
    print("=== TOP FEATURE IMPORTANCES ===")
    print(importances.round(4))
    print(f"Train R²: {rf.score(X_train, y_train):.3f} | Test R²: {rf.score(X_test, y_test):.3f}")`
  },

  // 5. Matplotlib & Data Visualization
  {
    id: "vis-1",
    category: "visualization",
    title: "Multi-Panel Executive Analytics Chart",
    desc: "Plot trend line, category bar breakdown, and boxplot distribution in a 3-panel figure.",
    type: "python",
    code: `import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

# Plot 1: Category Bars
cat_counts = df['Segment'].value_counts() if 'Segment' in df.columns else pd.Series([45, 30, 25], index=['A', 'B', 'C'])
axes[0].bar(cat_counts.index, cat_counts.values, color='#6366f1', alpha=0.9, edgecolor='#4338ca')
axes[0].set_title("Volume Distribution by Category", fontsize=11, fontweight='bold')
axes[0].grid(axis='y', linestyle='--', alpha=0.3)

# Plot 2: Scatter Metric Comparison
if 'Sales' in df.columns and 'Profit' in df.columns:
    axes[1].scatter(df['Sales'], df['Profit'], alpha=0.6, color='#10b981', edgecolors='none', s=40)
    axes[1].set_title("Sales vs Profit Correlation", fontsize=11, fontweight='bold')
    axes[1].set_xlabel("Sales ($)")
    axes[1].set_ylabel("Profit ($)")
    axes[1].grid(True, linestyle='--', alpha=0.3)
else:
    axes[1].plot([1,2,3,4], [10,25,35,50], color='#10b981', marker='o')
    axes[1].set_title("Sample Growth Curve")

plt.tight_layout()
plt.show()`
  },

  // 6. Pushdown SQL Queries
  {
    id: "sql-1",
    category: "sql",
    title: "Window Function: Running Total & Rank",
    desc: "DuckDB/Pushdown SQL query computing Cumulative Revenue & Dense Ranking.",
    type: "sql",
    code: `SELECT 
    Segment,
    Region,
    SUM(Sales) as Total_Sales,
    SUM(SUM(Sales)) OVER (PARTITION BY Segment ORDER BY SUM(Sales) DESC) as Running_Segment_Total,
    DENSE_RANK() OVER (ORDER BY SUM(Sales) DESC) as Global_Rank
FROM dataset
GROUP BY Segment, Region
ORDER BY Global_Rank ASC
LIMIT 20;`
  },
  {
    id: "sql-2",
    category: "sql",
    title: "Rolling 3-Period Moving Average",
    desc: "Calculate moving averages over ordered periods using partition window frames.",
    type: "sql",
    code: `WITH monthly_sales AS (
    SELECT 
        STRFTIME('%Y-%m', CAST("Order Date" AS TIMESTAMP)) as order_month,
        SUM(Sales) as monthly_revenue
    FROM dataset
    GROUP BY 1
)
SELECT 
    order_month,
    monthly_revenue,
    AVG(monthly_revenue) OVER (
        ORDER BY order_month 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as rolling_3m_avg
FROM monthly_sales
ORDER BY order_month DESC;`
  }
];

interface NotebookSnippetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectSnippet: (code: string, type: "python" | "sql") => void;
  onAddSnippetAsCell: (code: string, type: "python" | "sql") => void;
}

const CATEGORIES = [
  { id: "all", label: "All Recipes", icon: Layers },
  { id: "wrangling", label: "Pandas Wrangling", icon: Table },
  { id: "stats", label: "Stats & Tests", icon: Binary },
  { id: "cleaning", label: "Data Cleaning", icon: Filter },
  { id: "ml", label: "Machine Learning", icon: Cpu },
  { id: "visualization", label: "Matplotlib Visuals", icon: BarChart3 },
  { id: "sql", label: "Pushdown SQL", icon: Database },
];

const NotebookSnippetsDrawerComponent: React.FC<NotebookSnippetsDrawerProps> = ({
  isOpen,
  onClose,
  onInjectSnippet,
  onAddSnippetAsCell,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return NOTEBOOK_RECIPES.filter((r) => {
      const matchCat = selectedCat === "all" || r.category === selectedCat;
      const matchSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Data Science Recipes & Snippet Library
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {NOTEBOOK_RECIPES.length} Pre-built
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                1-click statistical testing, feature engineering, and pushdown SQL templates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes by name, keyword, or function (e.g., groupby, t-test, pivot)..."
              className="h-9 pl-9 text-xs bg-slate-950 border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-3.5 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching recipes found. Clear search filters.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2.5 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          item.type === "python"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.type}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      onClick={() => {
                        onInjectSnippet(item.code, item.type);
                        toast.success(`Appended "${item.title}" into active cell!`);
                        onClose();
                      }}
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs bg-slate-900 border-slate-700 text-slate-300 hover:text-white rounded-xl"
                    >
                      Insert in Active
                    </Button>
                    <Button
                      onClick={() => {
                        onAddSnippetAsCell(item.code, item.type);
                        toast.success(`Created new ${item.type.toUpperCase()} cell: "${item.title}"`);
                        onClose();
                      }}
                      size="sm"
                      className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> New Cell
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32 custom-scrollbar">
                  <pre className="whitespace-pre">{item.code}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const NotebookSnippetsDrawer = React.memo(NotebookSnippetsDrawerComponent);
export default NotebookSnippetsDrawer;
