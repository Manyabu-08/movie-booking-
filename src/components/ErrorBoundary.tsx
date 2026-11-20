import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { friendlyErrorMessage } from '../lib/firestoreError';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0D] text-[#F5F5F7] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#131318] border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              {friendlyErrorMessage(this.state.error)}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload CineBook AI
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
