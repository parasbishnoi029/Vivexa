const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/Settings.tsx', 'utf8');

// Add the new tab to TABS
code = code.replace('{ id: "security", label: "Security & 2FA", icon: Shield },', '{ id: "security", label: "Security & 2FA", icon: Shield },\n  { id: "enterprise", label: "Enterprise Architecture & SSO", icon: Server },');

// Add state for Enterprise toggles
code = code.replace('const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);', 'const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);\n  const [vpcEnabled, setVpcEnabled] = useState(false);\n  const [privateLinkEnabled, setPrivateLinkEnabled] = useState(false);\n  const [ssoProvider, setSsoProvider] = useState<"none"|"okta"|"entra">("none");');

// Add the tab content
const enterpriseContent = `
              {activeTab === "enterprise" && (
                <div className="space-y-8 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Server className="h-5 w-5 text-indigo-400" /> Enterprise Architecture & SSO
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage zero-trust federated identity, RBAC/RLS policies, and VPC deployments.</p>
                  </div>

                  {/* Bring-Your-Own-Identity (BYOI) Component */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-emerald-400" /> Bring-Your-Own-Identity (SSO)
                    </h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Okta Config */}
                      <div className={\`p-5 rounded-2xl border \${ssoProvider === "okta" ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}\`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                              <img src="https://www.vectorlogo.zone/logos/okta/okta-icon.svg" className="w-6 h-6 grayscale hover:grayscale-0 transition-all opacity-80" alt="Okta" />
                            </div>
                            <div>
                              <h5 className="font-bold text-white text-sm">Okta Enterprise (SAML)</h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Federated Identity Provider</p>
                            </div>
                          </div>
                          {ssoProvider === "okta" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/50">INACTIVE</span>
                          )}
                        </div>
                        
                        {ssoProvider === "okta" ? (
                          <div className="space-y-2 mt-4 pt-4 border-t border-emerald-500/10 text-[10px] font-mono text-slate-300">
                            <div className="flex justify-between"><span className="text-slate-500">Assertion URL:</span><span className="truncate max-w-[150px]">https://vivexa.ai/sso/okta/saml</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Entity ID:</span><span>vivexa-urn:okta:enterprise</span></div>
                            <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-[10px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => { setSsoProvider("none"); toast.success("Okta SSO Disabled"); }}>Disconnect</Button>
                          </div>
                        ) : (
                          <Button variant="default" size="sm" className="w-full mt-4 h-8 text-[11px] bg-slate-800 hover:bg-slate-700 text-white" onClick={() => { setSsoProvider("okta"); toast.success("Okta SSO Authorized"); }}>Configure Integration</Button>
                        )}
                      </div>

                      {/* Entra ID Config */}
                      <div className={\`p-5 rounded-2xl border \${ssoProvider === "entra" ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900/50 border-slate-800'}\`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                              <Globe className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                              <h5 className="font-bold text-white text-sm">Microsoft Entra ID (OIDC)</h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Corporate Active Directory</p>
                            </div>
                          </div>
                          {ssoProvider === "entra" ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/50">INACTIVE</span>
                          )}
                        </div>

                        {ssoProvider === "entra" ? (
                          <div className="space-y-2 mt-4 pt-4 border-t border-blue-500/10 text-[10px] font-mono text-slate-300">
                            <div className="flex justify-between"><span className="text-slate-500">Tenant ID:</span><span>0e42d...49a1f</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Client ID:</span><span>a912e...b198c</span></div>
                            <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-[10px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => { setSsoProvider("none"); toast.success("Entra ID SSO Disabled"); }}>Disconnect</Button>
                          </div>
                        ) : (
                          <Button variant="default" size="sm" className="w-full mt-4 h-8 text-[11px] bg-slate-800 hover:bg-slate-700 text-white" onClick={() => { setSsoProvider("entra"); toast.success("Entra ID SSO Authorized"); }}>Configure Integration</Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800/50 w-full" />

                  {/* Architecture & RBAC Visualization */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-cyan-400" /> Deployment & Network Security
                      </h4>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 font-bold">VPC Deployment</label>
                          <button onClick={() => { setVpcEnabled(!vpcEnabled); toast.success(vpcEnabled ? "VPC Integration Disabled" : "VPC Integration Enabled"); }} className="text-slate-400 hover:text-cyan-400">
                            {vpcEnabled ? <ToggleRight className="h-5 w-5 text-cyan-400" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 font-bold">AWS PrivateLink</label>
                          <button onClick={() => { setPrivateLinkEnabled(!privateLinkEnabled); toast.success(privateLinkEnabled ? "PrivateLink Disabled" : "PrivateLink Enabled"); }} className="text-slate-400 hover:text-indigo-400">
                            {privateLinkEnabled ? <ToggleRight className="h-5 w-5 text-indigo-400" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                      {vpcEnabled && <div className="absolute inset-0 border-2 border-dashed border-cyan-500/20 m-2 rounded-xl pointer-events-none" />}
                      {vpcEnabled && <span className="absolute top-4 left-6 text-[9px] font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Customer VPC Boundary</span>}

                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                        
                        {/* User Identity */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-lg relative">
                            <User className="h-5 w-5 text-slate-300" />
                            {ssoProvider !== "none" && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-0.5 rounded-full border-2 border-slate-950">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-bold text-white">Analyst Request</div>
                            <div className="text-[9px] font-mono text-slate-500">{ssoProvider !== "none" ? 'SAML Token Validated' : 'Standard Auth'}</div>
                          </div>
                        </div>

                        {/* Middle Middleware / RBAC */}
                        <div className="flex-1 flex items-center justify-center relative">
                          <div className={\`h-0.5 w-full \${privateLinkEnabled ? 'bg-indigo-500' : 'bg-slate-800'}\`} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="bg-slate-900 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] px-4 py-2 rounded-lg flex flex-col items-center">
                              <ShieldCheck className="h-5 w-5 text-rose-400 mb-1" />
                              <div className="text-[10px] font-bold text-white whitespace-nowrap">RBAC / RLS Engine</div>
                              <div className="text-[9px] font-mono text-rose-300/70 whitespace-nowrap">Query Filter Injection</div>
                            </div>
                          </div>
                          {privateLinkEnabled && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 rounded-full border border-indigo-500/20">PrivateLink Tunnel</span>
                          )}
                        </div>

                        {/* Target Database */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                            <Database className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-bold text-white">Data Warehouse</div>
                            <div className="text-[9px] font-mono text-slate-500">Filtered Rows Only</div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}
`;

code = code.replace('{activeTab === "sessions" && (', enterpriseContent + '\n              {activeTab === "sessions" && (');

if (!code.includes("Fingerprint")) {
  code = code.replace('ExternalLink} from "lucide-react";', 'ExternalLink, Fingerprint} from "lucide-react";');
}

fs.writeFileSync('src/pages/workspace/Settings.tsx', code);
