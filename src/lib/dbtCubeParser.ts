export interface ParsedSemanticMetric {
  id: string;
  name: string;
  description: string;
  expression: string;
  sql: string;
  type: "Sum" | "Count" | "Average" | "Ratio" | "Distinct";
  category: "Revenue" | "User Growth" | "Operational" | "Risk";
  status: "Verified" | "Draft";
  owner: string;
  lineage: string[];
  sourceFormat: "dbt-core" | "Cube.js" | "YAML-Semantic";
  rawDefinition?: any;
}

export class DbtCubeParser {
  /**
   * Parses dbt-core manifest.json or models/schema.yml
   */
  public static parseDbtManifest(jsonContent: string): ParsedSemanticMetric[] {
    try {
      const parsed = JSON.parse(jsonContent);
      const metrics: ParsedSemanticMetric[] = [];

      // 1. dbt Semantic Layer v1.6+ metrics node
      if (parsed.metrics && typeof parsed.metrics === "object") {
        for (const [key, node] of Object.entries<any>(parsed.metrics)) {
          const typeMapping: Record<string, ParsedSemanticMetric["type"]> = {
            simple: "Sum",
            ratio: "Ratio",
            cumulative: "Sum",
            derived: "Average",
            sum: "Sum",
            count: "Count",
            count_distinct: "Distinct",
            average: "Average"
          };

          const metricType = typeMapping[node.type?.toLowerCase()] || "Sum";
          const category = this.inferCategory(node.name || key, node.description || "");

          metrics.push({
            id: `dbt_${node.unique_id || key}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
            name: node.label || node.name || key,
            description: node.description || `dbt-core metric imported from model ${node.model || "semantic_layer"}`,
            expression: node.calculation_method || node.formula || node.expression || `aggregation(${node.type})`,
            sql: node.sql || `SELECT ${node.name || key} FROM {{ ref('${node.model || "fct_orders"}') }}`,
            type: metricType,
            category,
            status: "Verified",
            owner: node.meta?.owner || "dbt Data Engineering Team",
            lineage: [
              ...(node.depends_on?.nodes || []),
              `dbt.model.${node.model || "core"}`
            ],
            sourceFormat: "dbt-core",
            rawDefinition: node
          });
        }
      }

      // 2. dbt semantic_models node
      if (parsed.semantic_models && typeof parsed.semantic_models === "object") {
        for (const [smKey, smNode] of Object.entries<any>(parsed.semantic_models)) {
          if (Array.isArray(smNode.measures)) {
            for (const meas of smNode.measures) {
              const category = this.inferCategory(meas.name, meas.description || "");
              metrics.push({
                id: `dbt_meas_${smNode.name}_${meas.name}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
                name: meas.label || meas.name,
                description: meas.description || `Measure ${meas.name} from semantic model ${smNode.name}`,
                expression: `${meas.agg}(${meas.expr || meas.name})`,
                sql: `SELECT ${meas.agg}(${meas.expr || meas.name}) FROM ${smNode.model || smNode.name}`,
                type: meas.agg?.toLowerCase() === "count_distinct" ? "Distinct" : "Sum",
                category,
                status: "Verified",
                owner: "dbt Semantic Layer",
                lineage: [`dbt.model.${smNode.model || smNode.name}`],
                sourceFormat: "dbt-core"
              });
            }
          }
        }
      }

      if (metrics.length > 0) return metrics;
    } catch (_) {}

    // Fallback: YAML-style lines
    return this.parseDbtYaml(jsonContent);
  }

  /**
   * Parses dbt YAML schema file contents
   */
  public static parseDbtYaml(yamlContent: string): ParsedSemanticMetric[] {
    const metrics: ParsedSemanticMetric[] = [];
    const metricBlocks = yamlContent.split(/-\s+name:\s+/g).slice(1);

    for (const block of metricBlocks) {
      const lines = block.split("\n");
      const name = lines[0]?.trim() || "unnamed_metric";
      
      const labelMatch = block.match(/label:\s*["']?([^"'\n]+)/i);
      const descMatch = block.match(/description:\s*["']?([^"'\n]+)/i);
      const typeMatch = block.match(/type:\s*["']?([^"'\n]+)/i);
      const exprMatch = block.match(/(?:calculation_method|expression|formula|expr):\s*["']?([^"'\n]+)/i);
      const modelMatch = block.match(/model:\s*["']?([^"'\n]+)/i);

      const metricType: ParsedSemanticMetric["type"] = 
        typeMatch && typeMatch[1].toLowerCase().includes("ratio") ? "Ratio" :
        typeMatch && typeMatch[1].toLowerCase().includes("count") ? "Count" : "Sum";

      metrics.push({
        id: `dbt_yaml_${name}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
        name: labelMatch ? labelMatch[1] : name,
        description: descMatch ? descMatch[1] : `dbt metric ${name}`,
        expression: exprMatch ? exprMatch[1] : `SUM(${name})`,
        sql: `SELECT ${name} FROM {{ ref('${modelMatch ? modelMatch[1] : "fact_table"}') }}`,
        type: metricType,
        category: this.inferCategory(name, descMatch ? descMatch[1] : ""),
        status: "Verified",
        owner: "Analytics Engineering",
        lineage: [`dbt.schema.${modelMatch ? modelMatch[1] : "default"}`],
        sourceFormat: "YAML-Semantic"
      });
    }

    return metrics;
  }

  /**
   * Parses Cube.js schema JavaScript / YAML definitions
   */
  public static parseCubeSchema(content: string): ParsedSemanticMetric[] {
    const metrics: ParsedSemanticMetric[] = [];
    
    // Match cube({ name: '...', ... measures: { ... } })
    const cubeNameMatch = content.match(/cube\s*\(\s*[`'"]([^`'"]+)[`'"]/i);
    const cubeName = cubeNameMatch ? cubeNameMatch[1] : "AnalyticsCube";

    // Extract measures block
    const measureRegex = /(\w+)\s*:\s*\{\s*type\s*:\s*[`'"](\w+)[`'"](?:,\s*sql\s*:\s*(?:`([^`]+)`|["']([^"']+)["']))?/g;
    let match;

    while ((match = measureRegex.exec(content)) !== null) {
      const measureName = match[1];
      const rawType = match[2]?.toLowerCase();
      const sqlExpr = match[3] || match[4] || `${rawType}(${measureName})`;

      const typeMap: Record<string, ParsedSemanticMetric["type"]> = {
        sum: "Sum",
        count: "Count",
        countdistinct: "Distinct",
        countdistinctapprox: "Distinct",
        avg: "Average",
        number: "Ratio"
      };

      metrics.push({
        id: `cube_${cubeName}_${measureName}`.toLowerCase(),
        name: `${cubeName} - ${measureName.replace(/([A-Z])/g, " $1").trim()}`,
        description: `Cube.js semantic measure from cube '${cubeName}'`,
        expression: sqlExpr.trim(),
        sql: `SELECT ${sqlExpr.trim()} FROM ${cubeName.toLowerCase()}`,
        type: typeMap[rawType] || "Sum",
        category: this.inferCategory(measureName, cubeName),
        status: "Verified",
        owner: "Cube.js Semantic Layer",
        lineage: [`Cube.${cubeName}`, `DataWarehouse.${cubeName.toLowerCase()}`],
        sourceFormat: "Cube.js"
      });
    }

    return metrics;
  }

  /**
   * Exports Vivexa metrics into dbt-core schema.yml format
   */
  public static exportToDbtYaml(metrics: ParsedSemanticMetric[]): string {
    let out = `# dbt Semantic Layer Manifest generated by Vivexa Enterprise\nversion: 2\n\nmetrics:\n`;
    for (const m of metrics) {
      out += `  - name: ${m.name.toLowerCase().replace(/[^a-z0-9_]/g, "_")}\n`;
      out += `    label: "${m.name}"\n`;
      out += `    description: "${m.description}"\n`;
      out += `    type: ${m.type === "Ratio" ? "ratio" : m.type === "Distinct" ? "count_distinct" : "simple"}\n`;
      out += `    calculation_method: ${m.type.toLowerCase()}\n`;
      out += `    expression: "${m.expression}"\n`;
      out += `    meta:\n`;
      out += `      owner: "${m.owner}"\n`;
      out += `      category: "${m.category}"\n\n`;
    }
    return out;
  }

  /**
   * Exports Vivexa metrics into Cube.js model definition
   */
  public static exportToCubeSchema(metrics: ParsedSemanticMetric[], cubeName: string = "EnterpriseMetrics"): string {
    let out = `cube(\`${cubeName}\`, {\n  sql: \`SELECT * FROM enterprise_dw_gold\`,\n\n  measures: {\n`;
    for (const m of metrics) {
      const cleanKey = m.name.replace(/[^a-zA-Z0-9]/g, "");
      const cubeType = m.type === "Average" ? "avg" : m.type === "Distinct" ? "countDistinct" : m.type === "Ratio" ? "number" : "sum";
      out += `    ${cleanKey}: {\n`;
      out += `      type: \`${cubeType}\`,\n`;
      out += `      sql: \`${m.expression}\`,\n`;
      out += `      title: \`${m.name}\`,\n`;
      out += `      description: \`${m.description}\`\n`;
      out += `    },\n`;
    }
    out += `  },\n\n  dimensions: {\n    id: {\n      sql: \`id\`,\n      type: \`number\`,\n      primaryKey: true\n    }\n  }\n});\n`;
    return out;
  }

  private static inferCategory(name: string, desc: string): ParsedSemanticMetric["category"] {
    const text = `${name} ${desc}`.toLowerCase();
    if (text.includes("rev") || text.includes("mrr") || text.includes("arr") || text.includes("sales") || text.includes("spend") || text.includes("cost")) {
      return "Revenue";
    }
    if (text.includes("user") || text.includes("dau") || text.includes("mau") || text.includes("signup") || text.includes("growth")) {
      return "User Growth";
    }
    if (text.includes("churn") || text.includes("risk") || text.includes("incident") || text.includes("sla")) {
      return "Risk";
    }
    return "Operational";
  }
}
