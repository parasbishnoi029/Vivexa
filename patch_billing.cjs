const fs = require('fs');
const file = 'src/pages/workspace/Billing.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace Free Plan hardcoded text with new limits
code = code.replace(/1 Workspace/g, "1 Workspace");
code = code.replace(/Up to 3 Datasets/g, "Up to 3 Datasets");
code = code.replace(/50 AI API Calls \/ mo/g, "50 AI API Calls / mo");

// Student Plan
code = code.replace(/3 Workspaces/g, "2 Workspaces");
code = code.replace(/Unlimited Datasets/g, "Up to 10 Datasets");
code = code.replace(/250 AI API Calls \/ mo/g, "250 AI API Calls / mo");

// Pro Plan
code = code.replace(/Unlimited Workspaces/g, "Up to 5 Workspaces");
code = code.replace(/2,500 AI API Calls \/ mo/g, "2,500 AI API Calls / mo");
// Add datasets for pro
code = code.replace(/Advanced Analytics/g, "Up to 50 Datasets");

// Enterprise Plan
code = code.replace(/25,000 AI API Calls \/ mo/g, "25,000 AI API Calls / mo");

fs.writeFileSync(file, code);
