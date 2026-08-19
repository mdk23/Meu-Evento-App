'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="aurelia-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            background: 'color-mix(in srgb, var(--bad) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--bad) 30%, transparent)',
            color: 'var(--bad)',
          }}
        >
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="stack" style={{ gap: 8, marginTop: 20 }}>
          <h2 className="h-md">Something went wrong</h2>
          <p className="mini dim">
            A server error occurred while loading this page. This is usually caused by database connectivity issues or missing environment configuration.
          </p>
        </div>

        {error.message && (
          <div style={{ marginTop: 20, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)', textAlign: 'left' }}>
            <p className="mini num" style={{ color: 'var(--bad)', wordBreak: 'break-all' }}>
              {error.message}
            </p>
          </div>
        )}

        <div className="row" style={{ gap: 12, marginTop: 20 }}>
          <button onClick={() => reset()} className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>

          <Link href="/" className="btn" style={{ flex: 1, justifyContent: 'center' }}>
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
