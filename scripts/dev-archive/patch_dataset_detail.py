with open("src/pages/workspace/DatasetDetail.tsx", "r") as f:
    code = f.read()

target_th = """                        <th className="px-4 py-3 font-semibold">Min / Max</th>
                        <th className="px-4 py-3 font-semibold">Mean ± Std</th>
                        <th className="px-4 py-3 font-semibold">Outliers</th>"""
replacement_th = """                        <th className="px-4 py-3 font-semibold">Min / Max</th>
                        <th className="px-4 py-3 font-semibold">Mean ± Std</th>
                        <th className="px-4 py-3 font-semibold">Outliers</th>
                        <th className="px-4 py-3 font-semibold text-rose-400">Domain Invalid</th>"""

target_td = """                          <td className="px-4 py-3 text-amber-400">
                            {c.numericStats ? `${c.numericStats.outlierCount} (${c.numericStats.outlierPercentage}%)` : 'N/A'}
                          </td>"""
replacement_td = """                          <td className="px-4 py-3 text-amber-400">
                            {c.numericStats ? `${c.numericStats.outlierCount} (${c.numericStats.outlierPercentage}%)` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-rose-400 font-bold">
                            {c.domainInvalidCount > 0 ? `${c.domainInvalidCount} Flagged` : 'None'}
                          </td>"""

code = code.replace(target_th, replacement_th)
code = code.replace(target_td, replacement_td)

with open("src/pages/workspace/DatasetDetail.tsx", "w") as f:
    f.write(code)
