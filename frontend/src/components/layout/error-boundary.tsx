import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center">
          <p className="font-display text-2xl font-medium text-ink-900">
            Something went wrong.
          </p>
          <p className="max-w-sm text-sm text-ink-400">
            Try refreshing the page. If this keeps happening, contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}