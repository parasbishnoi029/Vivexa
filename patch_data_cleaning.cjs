const fs = require('fs');
let code = fs.readFileSync('src/components/workspace/DataCleaningStudio.tsx', 'utf8');
if (!code.includes('import { DatasetProfile }')) {
  code = 'import { DatasetProfile } from "@/lib/dataEngine";\n' + code;
}
if (!code.includes('import DataProcessorWorker')) {
  code = 'import DataProcessorWorker from "@/workers/dataProcessor?worker";\n' + code;
}
fs.writeFileSync('src/components/workspace/DataCleaningStudio.tsx', code);
