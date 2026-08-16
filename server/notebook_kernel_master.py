import sys
import os
import json
import traceback
import base64
import types
import csv
import subprocess
import re
from io import BytesIO

if len(sys.argv) < 2:
    print("Error: Config path required.")
    sys.exit(1)

config_file = sys.argv[1]
with open(config_file, 'r', encoding='utf-8') as f:
    config = json.load(f)

dataset_file = config.get('datasetPath', '')
dataset_name = config.get('datasetName', 'active_dataset.csv')
cell_type = config.get('cellType', 'python')
code_file = config.get('codePath', '')

raw_user_code = ""
if code_file and os.path.exists(code_file):
    with open(code_file, 'r', encoding='utf-8') as f:
        raw_user_code = f.read()

# Fallback MiniDataFrame shim if real pandas is not installed
class MiniDataFrame:
    def __init__(self, data, columns=None):
        if isinstance(data, list) and data and isinstance(data[0], list):
            self.columns = columns or [f'col_{i}' for i in range(len(data[0]))]
            self.rows = data
        elif isinstance(data, list) and data and isinstance(data[0], dict):
            self.columns = columns or list(data[0].keys())
            self.rows = [[r.get(c) for c in self.columns] for r in data]
        else:
            self.columns = columns or []
            self.rows = data if isinstance(data, list) else []

    @property
    def shape(self):
        return (len(self.rows), len(self.columns))

    @property
    def dtypes(self):
        return {col: "object" for col in self.columns}

    def head(self, n=5):
        return MiniDataFrame(self.rows[:n], self.columns)

    def tail(self, n=5):
        return MiniDataFrame(self.rows[-n:], self.columns)

    def info(self):
        out = f"<class 'pandas.DataFrame'>\nRangeIndex: {len(self.rows)} entries\nData columns (total {len(self.columns)} columns):\n"
        for i, col in enumerate(self.columns):
            non_null = sum(1 for r in self.rows if i < len(r) and r[i] is not None and str(r[i]).strip() != "")
            out += f" #{i}   {col}    {non_null} non-null     object\n"
        print(out)
        return out

    def describe(self, include='all'):
        out = f"Dataset Statistical Profile ({len(self.rows)} rows, {len(self.columns)} columns):\n"
        out += "Columns: " + ", ".join(self.columns) + "\n"
        for col in self.columns[:8]:
            idx = self.columns.index(col)
            vals = [r[idx] for r in self.rows if idx < len(r)]
            nums = []
            for v in vals:
                try:
                    nums.append(float(v))
                except (ValueError, TypeError):
                    pass
            if nums:
                mean_val = sum(nums) / len(nums)
                out += f" • {col}: count={len(nums)}, mean={mean_val:.2f}, min={min(nums)}, max={max(nums)}\n"
            else:
                out += f" • {col}: count={len(vals)}, unique={len(set(vals))}\n"
        print(out)
        return out

    def to_dict(self, orient='records'):
        if orient == 'records':
            return [{col: r[i] if i < len(r) else None for i, col in enumerate(self.columns)} for r in self.rows]
        return {col: [r[i] if i < len(r) else None for r in self.rows] for i, col in enumerate(self.columns)}

    def __repr__(self):
        header = " | ".join([str(c) for c in self.columns])
        body = "\n".join([" | ".join([str(x) for x in r]) for r in self.rows[:8]])
        return f"{header}\n{body}"

    def __str__(self):
        return self.__repr__()

def mini_read_csv(filepath_or_buffer, *args, **kwargs):
    if not os.path.exists(filepath_or_buffer):
        temp_dir = os.path.join(os.getcwd(), 'temp_data')
        sample_path = os.path.join(temp_dir, 'sample_sales_dataset.csv')
        if os.path.exists(sample_path):
            filepath_or_buffer = sample_path
    if os.path.exists(filepath_or_buffer):
        try:
            with open(filepath_or_buffer, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                rows = list(reader)
                if rows:
                    return MiniDataFrame(rows[1:], rows[0])
        except Exception:
            pass
    return MiniDataFrame([["Jan", 120000, 32000], ["Feb", 145000, 41000]], ["Month", "Sales", "Profit"])

class MiniPyplot:
    def figure(self, *args, **kwargs): return self
    def plot(self, *args, **kwargs): return self
    def bar(self, *args, **kwargs): return self
    def show(self, *args, **kwargs): return self
    def title(self, *args, **kwargs): return self
    def xlabel(self, *args, **kwargs): return self
    def ylabel(self, *args, **kwargs): return self
    def grid(self, *args, **kwargs): return self
    def savefig(self, *args, **kwargs): return self
    def close(self, *args, **kwargs): return self
    def get_fignums(self): return []

plt = None
pd = None
np = None

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except Exception:
    mpl_mod = types.ModuleType('matplotlib')
    plt_mod = MiniPyplot()
    mpl_mod.pyplot = plt_mod
    sys.modules['matplotlib'] = mpl_mod
    sys.modules['matplotlib.pyplot'] = plt_mod
    plt = plt_mod

try:
    import pandas as pd
except Exception:
    pd_mod = types.ModuleType('pandas')
    pd_mod.read_csv = mini_read_csv
    pd_mod.read_excel = mini_read_csv
    pd_mod.DataFrame = MiniDataFrame
    sys.modules['pandas'] = pd_mod
    pd = pd_mod

try:
    import numpy as np
except Exception:
    np_mod = types.ModuleType('numpy')
    np_mod.array = lambda x: x
    np_mod.mean = lambda x: sum(x)/len(x) if x else 0
    sys.modules['numpy'] = np_mod
    np = np_mod

df = None
metadata = {}
schema = {}
summary = {}
column_info = {}

if dataset_file and os.path.exists(dataset_file):
    try:
        if dataset_file.endswith('.xlsx') or dataset_file.endswith('.xls'):
            try:
                df = pd.read_excel(dataset_file)
            except Exception:
                df = mini_read_csv(dataset_file)
        else:
            df = pd.read_csv(dataset_file)
            
        rows_cnt = len(df) if hasattr(df, '__len__') else (len(df.rows) if hasattr(df, 'rows') else 0)
        cols_list = list(df.columns) if hasattr(df, 'columns') else []
        metadata = {
            "name": dataset_name,
            "rows": rows_cnt,
            "columns": cols_list
        }
        schema = {col: "object" for col in cols_list}
        summary = {"rows": rows_cnt}
        column_info = {col: {"type": "object", "null_count": 0, "unique_count": 10} for col in cols_list}
    except Exception as e:
        sys.stderr.write("Kernel auto-loading notice: " + str(e) + "\n")

if cell_type == 'sql':
    import sqlite3
    try:
        if df is not None:
            conn = sqlite3.connect(':memory:')
            table_aliases = ["dataset", "df", "workspace_dataset", "monthly_financials", "enterprise_sales_v3", "customer_segment"]
            clean_name = "".join([c if c.isalnum() else "_" for c in dataset_name.split('.')[0]])
            table_aliases.append(clean_name)
            
            # Save to sqlite natively to support MiniDataFrame without Pandas
            cursor = conn.cursor()
            cols = getattr(df, 'columns', [])
            records = []
            
            if not cols and hasattr(df, 'to_dict'):
                records = df.to_dict(orient='records')
                if records and isinstance(records, list):
                    cols = list(records[0].keys())
            else:
                if hasattr(df, 'to_dict'):
                    records = df.to_dict(orient='records')
                else:
                    rows = getattr(df, 'rows', getattr(df, 'values', []))
                    if rows and len(rows) > 0:
                        records = [dict(zip(cols, row)) for row in rows]
            
            if cols and records:
                cols_def = ", ".join([f'"{str(c)}" TEXT' for c in cols])
                for alias in table_aliases:
                    cursor.execute(f'CREATE TABLE "{alias}" ({cols_def})')
                    placeholders = ", ".join(["?"] * len(cols))
                    cursor.executemany(
                        f'INSERT INTO "{alias}" VALUES ({placeholders})',
                        [[str(rec.get(c, "")) for c in cols] for rec in records]
                    )
                conn.commit()

            # Execute query natively
            cursor = conn.cursor()
            cursor.execute(raw_user_code)
            res_cols = [description[0] for description in cursor.description]
            res_rows = cursor.fetchall()
            output_data = [dict(zip(res_cols, row)) for row in res_rows]
            print("VIVEXA_SQL_OUTPUT_START")
            print(json.dumps(output_data, default=lambda x: str(x)))
            print("VIVEXA_SQL_OUTPUT_END")
        else:
            print("Error: No active dataset dataframe loaded to query.")
    except Exception as e:
        exc_type, exc_value, exc_tb = sys.exc_info()
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_tb)
        print("VIVEXA_PYTHON_ERROR_START")
        print(json.dumps({
            "error_class": "SQLExecutionError",
            "message": str(e),
            "line_number": 1,
            "traceback": "".join(tb_lines),
            "suggested_fix": "Check table and column names in your SQL query. Select from 'dataset' or 'df'."
        }))
        print("VIVEXA_PYTHON_ERROR_END")

else:
    # Python Cell Execution with Colab Magic Commands support
    printed_lines = []
    
    python_code_lines = []
    SAFE_SHELL_COMMANDS = {'ls', 'head', 'tail', 'wc', 'cat', 'pwd', 'date', 'echo', 'which', 'whoami', 'df', 'free'}
    APPROVED_PIP_PACKAGES = {
        'pandas', 'numpy', 'scipy', 'scikit-learn', 'statsmodels', 'duckdb',
        'polars', 'matplotlib', 'seaborn', 'plotly', 'sympy', 'networkx',
        'openpyxl', 'xlsxwriter', 'pyarrow', 'fastparquet', 'altair',
        'spacy', 'nltk', 'torch', 'xgboost', 'lightgbm', 'catboost', 'sqlglot', 'tabulate'
    }

    for line in raw_user_code.split('\n'):
        stripped = line.strip()
        if stripped.startswith('!pip ') or stripped.startswith('%pip '):
            pkg_cmd = stripped.replace('!pip ', '').replace('%pip ', '').strip()
            # Clean package extraction
            base_pkg = re.split(r'[=<>~ ]+', pkg_cmd.replace('install', '').strip())[0].lower()
            if base_pkg in APPROVED_PIP_PACKAGES or pkg_cmd.startswith('list') or pkg_cmd.startswith('show'):
                printed_lines.append(f"[Sandbox Magic] Running pip {pkg_cmd}...")
                res = subprocess.run([sys.executable, "-m", "pip", "install", "--no-cache-dir", pkg_cmd.replace('install', '').strip()], capture_output=True, text=True)
                if res.stdout: printed_lines.append(res.stdout.strip())
                if res.stderr: printed_lines.append(res.stderr.strip())
            else:
                printed_lines.append(f"[Security Guard] Package '{base_pkg}' blocked. Approved packages: pandas, numpy, scipy, scikit-learn, duckdb, polars, matplotlib, seaborn, etc.")
        elif stripped.startswith('!'):
            sh_cmd = stripped[1:].strip()
            cmd_root = sh_cmd.split()[0] if sh_cmd else ""
            if cmd_root in SAFE_SHELL_COMMANDS:
                printed_lines.append(f"[Sandbox Shell] !{sh_cmd}")
                cmd_tokens = sh_cmd.split()
                res = subprocess.run(cmd_tokens, capture_output=True, text=True)
                if res.stdout: printed_lines.append(res.stdout.strip())
                if res.stderr: printed_lines.append(res.stderr.strip())
            else:
                printed_lines.append(f"[Security Guard] Shell command '{cmd_root}' is restricted in sandbox. Allowed: {', '.join(sorted(SAFE_SHELL_COMMANDS))}")
        elif stripped.startswith('%matplotlib') or stripped.startswith('%config'):
            printed_lines.append(f"[Magic Command] {stripped} enabled.")
        else:
            python_code_lines.append(line)

    clean_python_code = '\n'.join(python_code_lines)

    import io
    stdout_buffer = io.StringIO()
    sys.stdout = stdout_buffer

    locs = {
        'df': df,
        'metadata': metadata,
        'schema': schema,
        'summary': summary,
        'column_info': column_info,
        'plt': plt,
        'pd': pd,
        'np': np
    }

    # Auto import popular science libraries if installed
    for lib in ['pandas', 'numpy', 'seaborn', 'scipy', 'sklearn', 'statsmodels', 'xgboost', 'duckdb', 'plotly', 'polars']:
        try:
            locs[lib] = __import__(lib)
        except Exception:
            pass

    try:
        eval_result = None
        exec(clean_python_code, globals(), locs)
        
        # Check if the last non-empty line can be evaluated as an expression
        code_ast_lines = [l for l in clean_python_code.strip().split('\n') if l.strip() and not l.strip().startswith('#')]
        if code_ast_lines:
            last_line = code_ast_lines[-1].strip()
            if not any(last_line.startswith(kw) for kw in ['import ', 'from ', 'def ', 'class ', 'if ', 'for ', 'while ', 'try:', 'except', 'return', 'raise', 'print(', 'assert']) and '=' not in last_line:
                try:
                    eval_val = eval(last_line, globals(), locs)
                    if eval_val is not None:
                        eval_result = eval_val
                except Exception:
                    pass

        printed_text = stdout_buffer.getvalue()
        sys.stdout = sys.__stdout__

        if printed_lines:
            printed_text = '\n'.join(printed_lines) + ('\n' + printed_text if printed_text else '')

        # Auto-capture figures
        images = []
        try:
            if hasattr(plt, 'get_fignums'):
                figs = [plt.figure(num) for num in plt.get_fignums()]
                for fig in figs:
                    buf = BytesIO()
                    fig.savefig(buf, format='png', bbox_inches='tight', dpi=140)
                    buf.seek(0)
                    img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                    images.append(img_b64)
                    plt.close(fig)
        except Exception as fig_err:
            pass

        # Inspect variables for Variable Explorer
        vars_info = {}
        for k, v in locs.items():
            if k.startswith('_') or k in ['pandas', 'numpy', 'seaborn', 'scipy', 'sklearn', 'statsmodels', 'xgboost', 'duckdb', 'plotly', 'polars', 'plt', 'pd', 'np']:
                continue
            try:
                val_type = type(v).__name__
                if val_type == 'DataFrame':
                    val_summary = f"DataFrame ({v.shape[0]}x{v.shape[1]})"
                elif val_type == 'Series':
                    val_summary = f"Series ({v.shape[0]} items)"
                elif val_type == 'list':
                    val_summary = f"List [{len(v)} items]"
                elif val_type == 'dict':
                    val_summary = f"Dict [{len(v)} keys]"
                else:
                    val_summary = str(v)[:80]
                vars_info[k] = { "type": val_type, "summary": val_summary }
            except Exception:
                pass

        table_data = None
        if eval_result is not None:
            if hasattr(eval_result, 'to_dict'):
                try:
                    table_data = eval_result.to_dict(orient='records')
                except Exception:
                    printed_text += ("\n" + str(eval_result))
            elif isinstance(eval_result, (list, dict)):
                try:
                    table_data = eval_result if isinstance(eval_result, list) else [eval_result]
                except Exception:
                    printed_text += ("\n" + str(eval_result))
            else:
                printed_text += ("\n" + str(eval_result))

        print("VIVEXA_PYTHON_OUTPUT_START")
        print(json.dumps({
            "stdout": printed_text.strip(),
            "images": images,
            "table_data": table_data,
            "variables": vars_info,
            "success": True
        }))
        print("VIVEXA_PYTHON_OUTPUT_END")

    except Exception as e:
        sys.stdout = sys.__stdout__
        exc_type, exc_value, exc_tb = sys.exc_info()
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_tb)
        
        line_no = None
        for frame in traceback.extract_tb(exc_tb):
            if frame.filename == "<string>":
                line_no = frame.lineno
                break
                
        error_msg = str(e)
        error_cls = e.__class__.__name__

        pkg_name = None
        req_pkg = False
        suggested_fix = "Verify variable and column availability in your dataset."

        if "KeyError" in error_cls or "KeyError" in error_msg:
            suggested_fix = f"Column error: {error_msg}. Verify exact column names in df.columns."
        elif "NameError" in error_cls:
            match = re.search(r"name '(\w+)' is not defined", error_msg)
            var_name = match.group(1) if match else "variable"
            suggested_fix = f"NameError: '{var_name}' is not defined. Initialize or import it before referencing."
        elif "ModuleNotFoundError" in error_cls or "ImportError" in error_cls:
            match = re.search(r"No module named '([\w\.-]+)'", error_msg)
            pkg_name = match.group(1) if match else "library"
            req_pkg = True
            suggested_fix = f"Missing Python package '{pkg_name}'. Use !pip install {pkg_name} or click Auto-Fix to install."
        elif "SyntaxError" in error_cls:
            suggested_fix = "SyntaxError: Check quotes, parentheses, brackets, or colon matching."
        elif "IndentationError" in error_cls:
            suggested_fix = "IndentationError: Ensure consistent 4-space indentation."

        print("VIVEXA_PYTHON_ERROR_START")
        print(json.dumps({
            "error_class": error_cls,
            "message": error_msg,
            "line_number": line_no,
            "traceback": "".join(tb_lines),
            "suggested_fix": suggested_fix,
            "requires_package_install": req_pkg,
            "package_name": pkg_name
        }))
        print("VIVEXA_PYTHON_ERROR_END")
