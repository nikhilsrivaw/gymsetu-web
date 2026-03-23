import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-near-black flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-mono text-brand-orange text-xs uppercase font-bold mb-4">
          SOMETHING WENT WRONG
        </p>
        <h1 className="font-archivo text-4xl text-white uppercase mb-6">
          UNEXPECTED ERROR
        </h1>
        <button
          onClick={resetErrorBoundary}
          className="bg-brand-orange text-black px-6 py-3 font-archivo text-lg uppercase tracking-tighter hover:opacity-90"
        >
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}

interface Props { children: React.ReactNode; }

export const ErrorBoundary = ({ children }: Props) => (
  <ReactErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      // In production, forward to Sentry or similar error tracking
      console.error('[GymSetu Error]', error, info.componentStack);
    }}
  >
    {children}
  </ReactErrorBoundary>
);
