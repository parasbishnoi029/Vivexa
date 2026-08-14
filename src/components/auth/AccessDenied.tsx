import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
}

export function AccessDenied({
  title = "403 - Access Restricted",
  message = "You do not have permission to access this resource. Please contact your workspace administrator.",
  requiredRole = "Admin"
}: AccessDeniedProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-lg">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
      <p className="text-sm text-slate-400 max-w-md mt-2">{message}</p>
      
      <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
        Required Privilege Level: <span className="text-amber-400 font-bold">{requiredRole}</span>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Link to="/workspace">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs">
            <Home className="h-4 w-4 mr-1.5" /> Return to Workspace
          </Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()} className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Go Back
        </Button>
      </div>
    </div>
  );
}
