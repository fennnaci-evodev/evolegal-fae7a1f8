import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

/** Render failures must never strand users behind an indefinite chat loader. */
export class HugoErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-foreground">This chat could not be displayed. Your saved messages remain in your account.</p>
      <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />Reload chat</Button>
    </div>;
  }
}