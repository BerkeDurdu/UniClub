import type { ReactNode } from "react";
import { Component } from "react";
import Button from "../common/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    console.error("ErrorBoundary captured:", error);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="headline text-3xl font-bold text-ink">Something went wrong</h1>
          <p className="text-slate">An unexpected interface error occurred.</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
