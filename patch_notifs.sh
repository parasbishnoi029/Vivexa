sed -i 's/250 AI API calls/375 AI API calls/' src/lib/notifications.ts
sed -i 's/limit: 250,/limit: 375,/' src/components/workspace/QuotaLimitModal.tsx
