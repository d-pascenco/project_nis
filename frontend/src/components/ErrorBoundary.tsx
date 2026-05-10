import React from "react";
import { Button } from "@/components/ui/button";

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold text-foreground">Что-то пошло не так</h2>
          <pre className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg max-w-lg overflow-auto text-left whitespace-pre-wrap">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack?.split("\n").slice(0, 6).join("\n")}
          </pre>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
