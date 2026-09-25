import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary captured rendering error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-white mb-2">ForenClue Workspace</h2>
            <p className="text-xs text-slate-300 mb-4">
              The preview encountered an issue while loading. Click below to refresh your session.
            </p>
            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-xl text-left font-mono text-[11px] text-rose-300 mb-4 border border-rose-900/30 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('auth_user');
                    localStorage.removeItem('auth_token');
                    sessionStorage.clear();
                  } catch {}
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
              >
                Reset & Go to Login
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-all"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
