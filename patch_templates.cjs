const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/DataConnectors.tsx', 'utf8');

const additionalCategories = `const categories = ["All", "Databases", "Streaming & Event Broker", "Cloud Storage", "SaaS & CRM", "Analytics & Ads", "APIs & Webhooks"];`;
code = code.replace(
  'const categories = ["All", "Databases", "Cloud Storage", "SaaS & CRM", "Analytics & Ads", "APIs & Webhooks"];',
  additionalCategories
);

const newTemplates = `
  { id: "stream1", name: "Apache Kafka", category: "Streaming & Event Broker", type: "Event Streaming", status: "Disconnected", color: "text-amber-500", host: "kafka-prod.internal:9092",
    schemaPreview: [
      { table: "Topic: clickstream_events", columns: [{ name: "event_id", type: "STRING", key: true }, { name: "payload", type: "JSON" }] }
    ]
  },
  { id: "stream2", name: "AWS Kinesis", category: "Streaming & Event Broker", type: "Event Streaming", status: "Disconnected", color: "text-orange-500", host: "us-east-1 (Data Stream)",
    schemaPreview: [
      { table: "Stream: iot_sensor_telemetry", columns: [{ name: "partition_key", type: "STRING" }, { name: "data", type: "BINARY" }] }
    ]
  },
  { id: "stream3", name: "Confluent Cloud", category: "Streaming & Event Broker", type: "Event Streaming", status: "Disconnected", color: "text-slate-200", host: "pkc-1234.region.confluent.cloud:9092",
    schemaPreview: [
      { table: "Topic: financial_transactions", columns: [{ name: "tx_id", type: "STRING", key: true }, { name: "amount", type: "DOUBLE" }] }
    ]
  },
  // Databases`;

code = code.replace(
  '// Databases',
  newTemplates
);

fs.writeFileSync('src/pages/workspace/DataConnectors.tsx', code);
