const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

const printButton = `          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
          >
            <Printer className="h-4 w-4 mr-2 text-violet-400" /> Export PDF
          </Button>`;

code = code.replace(
  '<div className="flex items-center gap-2.5 flex-wrap">',
  '<div className="flex items-center gap-2.5 flex-wrap">\n' + printButton
);

fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
