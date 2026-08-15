sed -i 's/aiCallsLimit: 375/aiCallsLimit: 50/g' src/lib/limits.ts
sed -i 's/aiCallsLimit: 1875,/aiCallsLimit: 250,/g' src/lib/limits.ts
sed -i 's/aiCallsLimit: 18750,/aiCallsLimit: 2500,/g' src/lib/limits.ts
sed -i 's/aiCallsLimit: 187500,/aiCallsLimit: 25000,/g' src/lib/limits.ts

sed -i 's/375 AI API Calls \/ mo/50 AI API Calls \/ mo/g' src/pages/workspace/Billing.tsx
sed -i 's/1,875 AI API Calls \/ mo/250 AI API Calls \/ mo/g' src/pages/workspace/Billing.tsx
sed -i 's/18,750 AI API Calls \/ mo/2,500 AI API Calls \/ mo/g' src/pages/workspace/Billing.tsx
sed -i 's/187,500 AI API Calls \/ mo/25,000 AI API Calls \/ mo/g' src/pages/workspace/Billing.tsx

sed -i 's/allocated 375 AI API calls/allocated 50 AI API calls/g' src/lib/notifications.ts
