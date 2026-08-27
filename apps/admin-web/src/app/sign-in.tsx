'use client';

import * as React from 'react';
import { COPY } from '@dfc/core';
import { Button, Input } from '@/components/ui/primitives';
import { useAuth } from '@/lib/auth';

export function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(
        (err as { code?: string }).code === 'auth/invalid-credential'
          ? 'That email and password do not match an account.'
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-[340px] space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-lg font-semibold tracking-tight text-primary-foreground">
            D
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-[21px] font-semibold tracking-tight">{COPY.commandCenter.en}</h1>
            <p className="ta text-[13px] text-muted-foreground">{COPY.commandCenter.ta}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <Input
            type="email"
            autoComplete="username"
            placeholder="you@dfc.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10"
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-destructive-border bg-destructive-tint px-3 py-2 text-[12.5px] text-destructive-fg">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-placeholder">
          Staff accounts only. Riders and vendors use the mobile app.
        </p>
      </form>
    </main>
  );
}
