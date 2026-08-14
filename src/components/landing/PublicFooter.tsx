import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, Shield, CheckCircle2, ArrowRight } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl pt-16 pb-12 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-base shadow-lg">
                V
              </div>
              <span className="text-xl font-black text-white tracking-tight">Vivexa</span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm text-xs">
              Enterprise AI Decision Intelligence Platform. Transforming raw unstructured datasets into explainable, automated, and audited business decisions.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/parasbishnoi029"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 transition-all"
                title="GitHub Repository"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/paras029"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 transition-all"
                title="LinkedIn Profile"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="mailto:info.vivexa@gmail.com"
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 transition-all"
                title="Email Support"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/platform" className="hover:text-white transition-colors">AI Analyst</Link></li>
              <li><Link to="/platform" className="hover:text-white transition-colors">Forecasting</Link></li>
              <li><Link to="/platform" className="hover:text-white transition-colors">Notebooks</Link></li>
              <li><Link to="/platform" className="hover:text-white transition-colors">Automations</Link></li>
              <li><Link to="/platform" className="hover:text-white transition-colors">Data Connectors</Link></li>
              <li><Link to="/product-tour" className="text-indigo-400 font-bold hover:text-indigo-300">Product Tour</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Solutions</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/solutions?cat=finance" className="hover:text-white transition-colors">Finance</Link></li>
              <li><Link to="/solutions?cat=healthcare" className="hover:text-white transition-colors">Healthcare</Link></li>
              <li><Link to="/solutions?cat=retail" className="hover:text-white transition-colors">Retail & E-commerce</Link></li>
              <li><Link to="/solutions?cat=manufacturing" className="hover:text-white transition-colors">Manufacturing</Link></li>
              <li><Link to="/solutions?cat=fraud" className="hover:text-white transition-colors">Fraud & Risk</Link></li>
              <li><Link to="/solutions?cat=government" className="hover:text-white transition-colors">Government</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/founders" className="text-indigo-300 font-bold hover:text-white">Meet Founders</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/book-demo" className="hover:text-white transition-colors">Book a Demo</Link></li>
            </ul>
          </div>

          {/* Enterprise & Security */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Enterprise</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/enterprise" className="hover:text-white transition-colors">SOC2 & GDPR Compliance</Link></li>
              <li><Link to="/enterprise" className="hover:text-white transition-colors">Single Sign-On (SSO)</Link></li>
              <li><Link to="/enterprise" className="hover:text-white transition-colors">Role-Based Access (RBAC)</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/workspace/changelog" className="hover:text-white transition-colors">Release Notes</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>&copy; 2026 Vivexa, Inc. All rights reserved. Enterprise AI Platform.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/enterprise" className="hover:text-white transition-colors">Security</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="font-mono text-slate-600">v3.2.0-prod</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
