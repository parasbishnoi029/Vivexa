const fs = require('fs');
const file = 'src/pages/public/PricingPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const newPlans = `const plans = [
    {
      name: "Starter / Free",
      desc: "For individual analysts and developers testing autonomous queries and datasets.",
      priceMonthly: "$0",
      priceAnnual: "$0",
      features: [
        "1 User Workspace Seat",
        "50 AI Queries / mo",
        "Up to 3 Uploaded Datasets",
        "250 MB Total Storage",
        "Standard SQL & Python Execution",
        "Community Discord & Documentation"
      ],
      cta: "Get Started Free",
      highlight: false
    },
    {
      name: "Professional",
      desc: "For growing analytics teams scaling AI-native decision intelligence.",
      priceMonthly: "$199",
      priceAnnual: "$159",
      features: [
        "Up to 15 User Seats & 5 Workspaces",
        "2,500 AI Analyst Queries / mo",
        "Up to 50 Datasets & 10GB Storage",
        "Advanced Neural Time-Series Models",
        "10 Concurrent Notebook Runs",
        "Collaborative Python & SQL Notebooks",
        "Priority 24/7 Support SLA"
      ],
      cta: "Start Pro Trial",
      highlight: true
    },
    {
      name: "Enterprise Global",
      desc: "For Fortune 500, Healthcare & Government requiring dedicated capacity.",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      features: [
        "Unlimited User Seats & Datasets",
        "25,000 AI Analyst Queries / mo",
        "1TB Storage & 5GB Max File Size",
        "100 Concurrent Notebook Runs",
        "Dedicated Air-Gapped VPC / On-Prem",
        "SOC2, GDPR, HIPAA BAA Agreements",
        "Bring Your Own Key (BYOK) KMS",
        "Custom LLM Fine-Tuning & Connectors"
      ],
      cta: "Contact Enterprise Sales",
      highlight: false
    }
  ];`;

code = code.replace(/const plans = \[[\s\S]*?highlight: false\n    }\n  \];/, newPlans);
fs.writeFileSync(file, code);
