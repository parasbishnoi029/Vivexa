const fs = require('fs');
const content = fs.readFileSync('server/aiAnalyst.ts', 'utf8');

const updatedContent = content.replace(
  `"business_meaning": "Top 15% of accounts drive 65% of net revenue.",
      "impact": "High revenue sensitivity to top-tier account churn.",
      "risk": "Concentration risk if enterprise accounts experience service friction.",
      "recommended_action": "Establish dedicated customer success SLAs for top tier accounts.",
      "expected_benefit": "Reduce enterprise churn by 4.2% within 2 quarters."`,
  `"business_meaning": "Potential concentration in specific categories or accounts based on the provided columns.",
      "impact": "High revenue sensitivity to top-tier churn.",
      "risk": "Concentration risk if enterprise accounts experience service friction.",
      "recommended_action": "Investigate segment distribution and establish SLAs for top tier accounts.",
      "expected_benefit": "Improved retention for core segments."`
).replace(
  `"impact": "High ($1.2M Annual Value)",
      "effort": "Medium (3-4 weeks)",
      "estimated_risk": "Low",
      "dependencies": ["Clean transaction history", "Customer segmentation tags"],
      "expected_outcome": "Optimized pricing tiers and reduced churn.",
      "success_metrics": ["Net Revenue Retention > 112%", "Churn < 1.8%"]`,
  `"impact": "High (Strategic Value)",
      "effort": "Medium (3-4 weeks)",
      "estimated_risk": "Low",
      "dependencies": ["Clean transaction history", "Customer segmentation tags"],
      "expected_outcome": "Optimized operational efficiency and risk mitigation.",
      "success_metrics": ["Improved Retention", "Lower Churn"]`
).replace(
  `"COO": "Streamline fulfillment bottlenecks and reduce cycle times by 12%.",`,
  `"COO": "Streamline fulfillment bottlenecks and reduce cycle times.",`
).replace(
  `Industry Hint: \${industry_hint || 'Auto-detect'}`,
  `Industry Hint: \${industry_hint || 'Auto-detect'}
CRITICAL: Do NOT hallucinate specific dollar amounts, exact percentages, standard errors, statistical p-values, or bootstrap iterations unless explicitly provided in the dataset summary. Use qualitative assessments (e.g., "High", "Significant", "Potential") instead of making up exact numerical metrics.`
);

fs.writeFileSync('server/aiAnalyst.ts', updatedContent);
