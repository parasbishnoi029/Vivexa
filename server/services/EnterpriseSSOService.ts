/**
 * Enterprise SSO, SCIM 2.0 Provisioning & Security Governance Service
 * Handles SAML 2.0 (Okta, Azure AD Entra, Google Workspace), SCIM 2.0 Directory Sync,
 * and Row-Level (RLS) / Column-Level Security (CLS) dynamic masking filters.
 */

import crypto from "crypto";

export type SSOIdentityProvider = "Okta" | "Azure-AD-Entra" | "Google-Workspace" | "Ping-Identity" | "Custom-SAML";

export interface SSOConfig {
  id: string;
  tenantId: string;
  provider: SSOIdentityProvider;
  entityId: string;
  ssoAcsUrl: string;
  idpMetadataUrl?: string;
  idpCertificateFingerprint?: string;
  enforceSSOOnly: boolean;
  autoProvisionRoles: boolean;
  defaultRole: string;
  scimToken: string;
  enabled: boolean;
  lastSyncAt: number;
}

export type MaskingRuleType = "FULL_MASK" | "PARTIAL_EMAIL" | "PARTIAL_CREDIT_CARD" | "HASH_SHA256" | "NULLIFY";

export interface ColumnSecurityPolicy {
  id: string;
  columnName: string;
  tableName: string;
  maskingType: MaskingRuleType;
  exemptRoles: string[]; // Roles that see unmasked raw data
  description: string;
}

export interface RowSecurityPolicy {
  id: string;
  tableName: string;
  filterExpression: string; // e.g. "tenant_id = :user_tenant AND department = :user_dept"
  enforcedRoles: string[]; // Roles subject to this filter
  description: string;
}

export class EnterpriseSSOService {
  private static ssoConfigs: Map<string, SSOConfig> = new Map();
  private static columnPolicies: Map<string, ColumnSecurityPolicy> = new Map();
  private static rowPolicies: Map<string, RowSecurityPolicy> = new Map();

  static {
    this.initDefaultPolicies();
  }

  private static initDefaultPolicies() {
    // Default SAML configuration
    const defaultSSO: SSOConfig = {
      id: "sso-cfg-enterprise-01",
      tenantId: "default_tenant",
      provider: "Okta",
      entityId: "https://auth.vivexa.ai/saml/metadata/enterprise",
      ssoAcsUrl: "https://auth.vivexa.ai/saml/acs",
      idpMetadataUrl: "https://enterprise-auth.okta.com/app/exk482/sso/saml/metadata",
      idpCertificateFingerprint: "E4:8F:12:9A:BB:43:21:6C:54:19:D8:00:23:44:11:AB",
      enforceSSOOnly: false,
      autoProvisionRoles: true,
      defaultRole: "Analyst",
      scimToken: "vx_scim_live_9a8f21e0b4c29188471e",
      enabled: true,
      lastSyncAt: Date.now() - 3600000
    };
    this.ssoConfigs.set(defaultSSO.tenantId, defaultSSO);

    // Default Column Level Security (CLS) Masking Policies
    const clsPolicies: ColumnSecurityPolicy[] = [
      {
        id: "cls-ssn",
        columnName: "ssn",
        tableName: "*",
        maskingType: "FULL_MASK",
        exemptRoles: ["Super Admin", "Admin"],
        description: "Masks Social Security Numbers across all tables"
      },
      {
        id: "cls-salary",
        columnName: "salary",
        tableName: "employees",
        maskingType: "FULL_MASK",
        exemptRoles: ["Super Admin", "Admin", "Manager"],
        description: "Protects employee compensation figures"
      },
      {
        id: "cls-email",
        columnName: "email",
        tableName: "*",
        maskingType: "PARTIAL_EMAIL",
        exemptRoles: ["Super Admin", "Admin", "Data Scientist"],
        description: "Partially masks customer emails (e.g. j***@domain.com)"
      },
      {
        id: "cls-card",
        columnName: "credit_card",
        tableName: "transactions",
        maskingType: "PARTIAL_CREDIT_CARD",
        exemptRoles: ["Super Admin"],
        description: "Masks payment credit cards to show last 4 digits only (****-****-****-1234)"
      }
    ];
    clsPolicies.forEach((p) => this.columnPolicies.set(p.id, p));

    // Default Row Level Security (RLS) Policies
    const rlsPolicies: RowSecurityPolicy[] = [
      {
        id: "rls-tenant",
        tableName: "*",
        filterExpression: "tenant_id = :user_tenant_id",
        enforcedRoles: ["Analyst", "Member", "Viewer", "Data Scientist"],
        description: "Strict multi-tenant row isolation across all datasets"
      },
      {
        id: "rls-department",
        tableName: "fact_sales",
        filterExpression: "region IN (:user_assigned_regions)",
        enforcedRoles: ["Analyst", "Member", "Viewer"],
        description: "Restricts sales record access to user's assigned geographical region"
      }
    ];
    rlsPolicies.forEach((p) => this.rowPolicies.set(p.id, p));
  }

  public static getSSOConfig(tenantId: string = "default_tenant"): SSOConfig | undefined {
    return this.ssoConfigs.get(tenantId);
  }

  public static updateSSOConfig(config: SSOConfig): SSOConfig {
    this.ssoConfigs.set(config.tenantId, config);
    return config;
  }

  public static listColumnPolicies(): ColumnSecurityPolicy[] {
    return Array.from(this.columnPolicies.values());
  }

  public static listRowPolicies(): RowSecurityPolicy[] {
    return Array.from(this.rowPolicies.values());
  }

  /**
   * Applies Column-Level Security (CLS) masking to a batch of result rows
   * based on the user's active role.
   */
  public static maskRowData(rows: Record<string, any>[], userRole: string): Record<string, any>[] {
    if (!rows || rows.length === 0) return rows;

    const applicablePolicies = Array.from(this.columnPolicies.values()).filter(
      (p) => !p.exemptRoles.includes(userRole)
    );

    if (applicablePolicies.length === 0) return rows;

    return rows.map((row) => {
      const masked = { ...row };
      for (const policy of applicablePolicies) {
        const col = policy.columnName.toLowerCase();
        for (const [key, val] of Object.entries(row)) {
          if (key.toLowerCase() === col || policy.tableName === "*") {
            if (key.toLowerCase() === col && val !== null && val !== undefined) {
              masked[key] = this.applyMask(String(val), policy.maskingType);
            }
          }
        }
      }
      return masked;
    });
  }

  private static applyMask(val: string, maskType: MaskingRuleType): string {
    switch (maskType) {
      case "FULL_MASK":
        return "••••••••";
      case "PARTIAL_EMAIL": {
        const parts = val.split("@");
        if (parts.length === 2) {
          const name = parts[0];
          const maskedName = name.length > 2 ? `${name[0]}•••${name[name.length - 1]}` : "•••";
          return `${maskedName}@${parts[1]}`;
        }
        return "•••@domain.com";
      }
      case "PARTIAL_CREDIT_CARD": {
        const digits = val.replace(/\D/g, "");
        const last4 = digits.slice(-4) || "0000";
        return `••••-••••-••••-${last4}`;
      }
      case "HASH_SHA256":
        return crypto.createHash("sha256").update(val).digest("hex").slice(0, 16);
      case "NULLIFY":
        return "[RESTRICTED]";
      default:
        return "••••••••";
    }
  }

  /**
   * Generates RLS SQL WHERE clauses dynamically based on user credentials
   */
  public static generateRLSClause(tableName: string, userContext: { tenantId: string; role: string; regions?: string[] }): string | null {
    if (userContext.role === "Super Admin" || userContext.role === "Admin") {
      return null; // Admins bypass local RLS
    }

    const clauses: string[] = [`tenant_id = '${userContext.tenantId}'`];
    if (userContext.regions && userContext.regions.length > 0) {
      const regionList = userContext.regions.map((r) => `'${r}'`).join(", ");
      clauses.push(`region IN (${regionList})`);
    }

    return clauses.join(" AND ");
  }
}
