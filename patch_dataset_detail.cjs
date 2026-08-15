const fs = require('fs');
const file = 'src/pages/workspace/DatasetDetail.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update DataCleaningStudio invocation
code = code.replace(
  /<DataCleaningStudio\n\s*rows={fullRows}\n\s*datasetName={dataset.name}\n\s*onDatasetCleaned={\(res\) => {\n\s*setFullRows\(res.cleanedRows\);\n\s*setPreviewCols\(res.columns\);\n\s*const computed = profileDataset\(res.cleanedRows, dataset.name, \{ fileSize: dataset.size_bytes \}\);\n\s*setProfile\(computed\);\n\s*setSortCol\(null\);\n\s*setCurrentPage\(1\);\n\s*}}\n\s*\/>/g,
  `<DataCleaningStudio
              rows={fullRows}
              datasetName={dataset.name}
              datasetSize={dataset.size_bytes}
              onDatasetCleaned={(res, profile) => {
                setFullRows(res.cleanedRows);
                setPreviewCols(res.columns);
                setProfile(profile);
                setSortCol(null);
                setCurrentPage(1);
              }}
            />`
);

fs.writeFileSync(file, code);
