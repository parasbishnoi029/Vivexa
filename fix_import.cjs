const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "import { Parser as SqlParser } from 'node-sql-parser';",
  "import sqlParserPkg from 'node-sql-parser';\nconst SqlParser = sqlParserPkg.Parser;"
);

fs.writeFileSync('server.ts', code);
