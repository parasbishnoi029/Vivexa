import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <Card className="max-w-md w-full border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-400 mb-6">
                An unexpected error occurred. Our team has been notified.
              </p>
              <div className="bg-slate-900/50 p-3 rounded-md w-full text-left overflow-auto mb-6 max-h-32">
                <code className="text-xs text-red-400 font-mono">
                  {this.state.error?.message || "Unknown error"}
                </code>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-100 hover:bg-white text-slate-900"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
