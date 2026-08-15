import { parseDatasetFile } from "./src/lib/datasetParser.ts";
import { profileDataset } from "./src/lib/dataEngine.ts";
import { AnalysisValidator } from "./src/lib/analysisValidator.ts";
import { cleanDataset } from "./src/lib/dataCleaning.ts";

const csv = `id,name,age,salary,is_active,join_date
1,Alice,30,50000.5,true,2021-01-01
2,Bob,45,120000.0,false,2020-05-15
3,Charlie,25,,true,2022-11-20
4,David,150,45000,yes,2019-07-11
5,Eve,28,95000,no,2023-02-01
`;

async function run() {
  console.log("--- PARSER ---");
  const parsed = await parseDatasetFile(csv, "test.csv");
  console.log("Rows:", parsed.rows);
  
  console.log("\n--- ENGINE ---");
  const profile = profileDataset(parsed.rows, "test.csv");
  console.log("Scores:", profile.scores);
  
  console.log("\n--- Z-SCORES (Validator) ---");
  const zScores = AnalysisValidator.runPass1_ZScoreVerification(profile, parsed.rows, 3.0);
  console.log("Z-Score pass1 health:", zScores.overallDistributionHealth);
  
  console.log("\n--- CLEANING ---");
  const cleaned = cleanDataset(parsed.rows, { missingValueStrategy: 'mean' });
  console.log("Cleaned rows length:", cleaned.cleanedRows.length);
}
run().catch(console.error);
