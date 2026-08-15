import { parseDatasetFile } from "./src/lib/datasetParser.ts";
import { profileDataset } from "./src/lib/dataEngine.ts";

const csv = `id,name,age,salary,is_active,join_date
1,Alice,30,50000.5,true,2021-01-01
2,Bob,45,120000.0,false,2020-05-15
3,Charlie,25,,true,2022-11-20
4,David,150,45000,yes,2019-07-11
5,Eve,28,95000,no,2023-02-01
`;

async function run() {
  const parsed = await parseDatasetFile(csv, "test.csv");
  console.log("Parsed Columns:", parsed.columns);
  console.log("Column Types:", parsed.columnTypes);
  const profile = profileDataset(parsed.rows, "test.csv");
  console.log("Profile numeric:", profile.numericColumns);
  console.log("Profile cat:", profile.categoricalColumns);
  console.log("Profile score:", profile.scores);
  console.log("Profile outlier:", profile.columns.find(c => c.name === "age")?.numericStats?.outlierCount);
}

run().catch(console.error);
