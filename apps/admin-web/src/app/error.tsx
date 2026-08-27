'use client';

import * as React from 'react';

/**
 * The board is a live view of money in motion. When it breaks, the useful
 * thing is the actual error and a retry — not a friendly shrug that hides
 * what an operator needs to tell an engineer.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[dfc] unhandled error', error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[21px] font-semibold tracking-tight">The board stopped</h1>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            Orders are safe — this is a display problem, not a data one. Retry, and if it keeps
            happening send an engineer the message below.
          </p>
        </div>

        <pre className="tnum overflow-x-auto rounded-lg border border-destructive-border bg-destructive-tint p-3 text-[11.5px] leading-relaxed text-destructive-fg">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ''}
        </pre>

        <div className="flex gap-2.5">
          <button
            onClick={reset}
            className="h-10 flex-1 rounded-lg bg-primary text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-10 rounded-lg border px-5 text-[14px] font-medium text-body-strong transition-colors hover:bg-muted"
          >
            Reload
          </button>
        </div>
      </div>
    </main>
  );
}
