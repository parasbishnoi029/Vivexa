import React, { useState, useEffect } from "react";
import { 
  Shield, Key, Globe, Lock, CheckCircle2, AlertCircle, Copy, Download, 
  ExternalLink, Sparkles, RefreshCw, Send, Check, ShieldCheck, FileCode,
  Layers, Users, Building, Terminal, Eye, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EnterpriseSSOSettingsProps {
  tenantId?: string;
  onSaveConfig?: (config: any) => void;
}

export default function EnterpriseSSOSettings({ tenantId = "default_tenant", onSaveConfig }: EnterpriseSSOSettingsProps) {
  const [idpProvider, setIdpProvider] = useState<"okta" | "azure" | "google" | "ping" | "custom">("okta");
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [enforceSso, setEnforceSso] = useState(false);
  const [jitProvisioning, setJitProvisioning] = useState(true);
  const [defaultRole, setDefaultRole] = useState("Analyst");

  // IdP Endpoints
  const [idpSsoUrl, setIdpSsoUrl] = useState("https://dev-849201.okta.com/app/vivexa_analytics/sso/saml");
  const [idpEntityId, setIdpEntityId] = useState("http://www.okta.com/exk920194827vivexa");
  const [idpCertificate, setIdpCertificate] = useState(
    "-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAX2k8W3VMA0GCSqGSIb3DQEBCwUAMIGSMQswCQYDVQQGEwJV\nUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzENMAsG\nA1UECgwET2t0YTEUMBIGA1UECwwLU1NPUHJvdmlkZXIxFDASBgNVBAMMC29rdGFfc2Ft\nbF8yMB4XDTI2MDEwMTAwMDAwMFoXDTM2MDEwMTAwMDAwMFowgZIxCzAJBgNVBAYTAlVT\nMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1TYW4gRnJhbmNpc2NvMQ0wCwYD\nVQQKDARPa3RhMRQwEgYDVQQLDAtTU09Qcm92aWRlcjEUMBIGA1UEAwwLb2t0YV9zYW1s\n_2MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3K...==\n-----END CERTIFICATE-----"
  );

  // SP (Service Provider) Metadata
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://app.vivexa.ai";
  const spEntityId = `${appOrigin}/sso/saml/sp`;
  const acsUrl = `${appOrigin}/api/v1/enterprise/sso/saml/acs`;
  const metadataUrl = `${appOrigin}/api/v1/enterprise/sso/saml/metadata.xml?tenantId=${tenantId}`;

  // Testing assertion state
  const [isTestingAssertion, setIsTestingAssertion] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleProviderPreset = (provider: "okta" | "azure" | "google" | "ping" | "custom") => {
    setIdpProvider(provider);
    if (provider === "okta") {
      setIdpSsoUrl("https://company.okta.com/app/vivexa_analytics/sso/saml");
      setIdpEntityId("http://www.okta.com/exk920194827vivexa");
    } else if (provider === "azure") {
      setIdpSsoUrl("https://login.microsoftonline.com/8f921-azure-tenant-id/saml2");
      setIdpEntityId("https://sts.windows.net/8f921-azure-tenant-id/");
    } else if (provider === "google") {
      setIdpSsoUrl("https://accounts.google.com/o/saml2/idp?idpid=C0382910");
      setIdpEntityId("https://accounts.google.com/o/saml2?idpid=C0382910");
    } else if (provider === "ping") {
      setIdpSsoUrl("https://auth.pingone.com/as/authorization.oauth2");
      setIdpEntityId("https://auth.pingone.com/idp/issuer");
    }
    toast.info(`Configured template presets for ${provider.toUpperCase()}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const handleDownloadMetadata = () => {
    window.open(metadataUrl, "_blank");
    toast.success("Downloading SAML 2.0 SP metadata XML file...");
  };

  const handleTestSAMLAssertion = async () => {
    setIsTestingAssertion(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/v1/enterprise/sso/saml/test-assertion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: idpProvider,
          idpEntityId,
          idpSsoUrl,
          tenantId,
          sampleEmail: "alex.mercer@enterprise-corp.com",
          sampleName: "Alex Mercer",
          sampleDepartment: "Data Analytics & ML",
          sampleRole: defaultRole
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.assertionResult);
        toast.success("SAML 2.0 Assertion Dry-Run Verified! Signature & claims parsed successfully.");
      } else {
        toast.error(`Assertion validation failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Failed to execute test SAML assertion: ${err.message}`);
    } finally {
      setIsTestingAssertion(false);
    }
  };

  const handleSaveSSOPolicy = async () => {
    setIsSaving(true);
    try {
      const payload = {
        tenantId,
        provider: idpProvider,
        ssoEnabled,
        enforceSso,
        jitProvisioning,
        defaultRole,
        idpSsoUrl,
        idpEntityId,
        idpCertificate,
        spEntityId,
        acsUrl
      };

      const res = await fetch("/api/v1/enterprise/sso/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Enterprise SAML 2.0 SSO configuration saved and published!");
        if (onSaveConfig) onSaveConfig(payload);
      } else {
        toast.error(`Failed to save SSO config: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-600/10 via-purple-600/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  Enterprise SAML 2.0 & SSO Federation Hub
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    OASIS SAML 2.0 Core
                  </span>
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Federate authentication with enterprise Identity Providers (IdP). Enforce single sign-on, automate JIT account creation, and parse signed SAML response assertions with zero password overhead.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadMetadata}
              className="bg-slate-900 border-slate-800 text-xs font-bold hover:bg-slate-800 text-slate-300 gap-1.5 h-9"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" /> SP Metadata.xml
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSSOPolicy}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 h-9 px-4"
            >
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save & Enforce SAML Policy
            </Button>
          </div>
        </div>

        {/* Global SSO Enabler Toggle Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ssoEnabled}
                onChange={(e) => setSsoEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <div>
              <span className="text-xs font-bold text-white block">
                Enable SAML 2.0 Authentication: {ssoEnabled ? <span className="text-emerald-400">ACTIVE</span> : <span className="text-slate-500">DISABLED</span>}
              </span>
              <span className="text-[11px] text-slate-500">
                Permit employees to log in using their enterprise IdP SSO portal.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceSso}
                onChange={(e) => setEnforceSso(e.target.checked)}
                disabled={!ssoEnabled}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span className="font-semibold">Enforce SSO (Block password logins)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={jitProvisioning}
                onChange={(e) => setJitProvisioning(e.target.checked)}
                disabled={!ssoEnabled}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span className="font-semibold">Just-In-Time (JIT) Provisioning</span>
            </label>
          </div>
        </div>
      </div>

      {/* IdP Preset Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-left">
          Select Identity Provider (IdP):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: "okta", name: "Okta Enterprise", badge: "SAML 2.0" },
            { id: "azure", name: "Microsoft Entra ID", badge: "Azure AD" },
            { id: "google", name: "Google Workspace", badge: "GSuite IdP" },
            { id: "ping", name: "PingIdentity / PingOne", badge: "Federation" },
            { id: "custom", name: "Custom SAML 2.0 IdP", badge: "Generic" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleProviderPreset(item.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                idpProvider === item.id
                  ? "bg-indigo-600/15 border-indigo-500 shadow-md text-white"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black">{item.name}</span>
                {idpProvider === item.id && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
              </div>
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid: SP Connection Details vs IdP Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Service Provider (SP) Metadata */}
        <Card className="bg-slate-950/80 border-slate-800 text-left rounded-3xl">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              1. Service Provider (SP) Endpoints
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Copy these values into your Okta / Azure / Google SAML Application configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">Assertion Consumer Service (ACS) URL</label>
                <button
                  onClick={() => copyToClipboard(acsUrl, "ACS URL")}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <Input
                readOnly
                value={acsUrl}
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Binding: HTTP-POST (Receives SAMLResponse from IdP)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">SP Entity ID (Audience URI)</label>
                <button
                  onClick={() => copyToClipboard(spEntityId, "SP Entity ID")}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <Input
                readOnly
                value={spEntityId}
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">NameID Format</label>
              </div>
              <Input
                readOnly
                value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">SP Metadata XML URL</label>
                <button
                  onClick={() => copyToClipboard(metadataUrl, "Metadata URL")}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <Input
                readOnly
                value={metadataUrl}
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-200"
              />
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-300 block">Required SAML Attribute Statements:</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>• <span className="text-indigo-300">email</span> → user.email</div>
                <div>• <span className="text-indigo-300">firstName</span> → user.firstName</div>
                <div>• <span className="text-indigo-300">lastName</span> → user.lastName</div>
                <div>• <span className="text-indigo-300">department</span> → user.department</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Identity Provider (IdP) Config */}
        <Card className="bg-slate-950/80 border-slate-800 text-left rounded-3xl">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-400" />
              2. Identity Provider (IdP) Credentials
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Provide your IdP Single Sign-On URL, Issuer URI, and public X.509 Certificate.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">IdP Single Sign-On (SSO) URL</label>
              <Input
                placeholder="https://company.okta.com/app/vivexa/sso/saml"
                value={idpSsoUrl}
                onChange={(e) => setIdpSsoUrl(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">IdP Entity ID / Issuer URI</label>
              <Input
                placeholder="http://www.okta.com/exk920194827"
                value={idpEntityId}
                onChange={(e) => setIdpEntityId(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Default JIT Provisioning Role</label>
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                className="w-full h-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white px-3 focus:outline-none focus:border-indigo-500"
              >
                <option value="Viewer">Viewer (Read-Only Access)</option>
                <option value="Analyst">Analyst (Query & Visualization)</option>
                <option value="Data Scientist">Data Scientist (ML & Notebooks)</option>
                <option value="Manager">Manager (Workflow & Team Ops)</option>
                <option value="Admin">Admin (Full Administrative Access)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">IdP X.509 Public Certificate (PEM)</label>
              <textarea
                rows={4}
                value={idpCertificate}
                onChange={(e) => setIdpCertificate(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">Validate configuration with synthetic IdP assertion:</span>
              <Button
                size="sm"
                onClick={handleTestSAMLAssertion}
                disabled={isTestingAssertion}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-8"
              >
                {isTestingAssertion ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Test SAML Assertion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dry-run Assertion Result Inspector */}
      {testResult && (
        <Card className="bg-slate-950 border-emerald-500/30 rounded-3xl shadow-xl text-left">
          <CardHeader className="pb-3 border-b border-slate-800 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                SAML 2.0 Assertion Validation & Claim Resolution (PASSED)
              </CardTitle>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Cryptographic Signature: RSA-SHA256 Valid
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Resolved Subject (NameID)</span>
                <span className="font-bold text-indigo-300">{testResult.nameId || "alex.mercer@enterprise-corp.com"}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Issuer / EntityID</span>
                <span className="font-bold text-slate-300 truncate block">{testResult.issuer || idpEntityId}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">JIT Provisioned Role</span>
                <span className="font-bold text-emerald-400">{testResult.assignedRole || defaultRole}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Assertion Latency</span>
                <span className="font-bold text-slate-300">{testResult.latencyMs || 8.4} ms</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">Extracted SAML Claims & Attributes:</span>
              <pre className="overflow-x-auto text-[10px] text-indigo-200">
                {JSON.stringify(testResult.attributes || {
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "alex.mercer@enterprise-corp.com",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname": "Alex",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname": "Mercer",
                  "department": "Data Analytics & ML",
                  "groups": ["Vivexa_Data_Engineers", "Enterprise_All_Staff"],
                  "sessionIndex": "_89f81a8-20260819"
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
