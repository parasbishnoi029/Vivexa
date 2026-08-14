import pandas as pd
import sqlite3

df = pd.DataFrame({'a': [1,2], 'b': [3,4]})
conn = sqlite3.connect(':memory:')
df.to_sql('test_table', conn, index=False)

res_df = pd.read_sql_query('SELECT * FROM test_table', conn)
print(res_df)
