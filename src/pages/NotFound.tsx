import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppBackground } from "@/components/layout/AppBackground";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <AppBackground centered={true}>
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10">
        <Card className="max-w-md w-full bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Search className="h-8 w-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
              404 - Page Not Found
            </span>

            <h1 className="text-2xl font-bold text-white mb-2">
              Lost in the workspace?
            </h1>

            <p className="text-sm text-slate-400 mb-6">
              The page or resource you are looking for does not exist or has been moved to another location.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate("/workspace")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                <Home className="mr-2 h-4 w-4" />
                Workspace Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppBackground>
  );
}
