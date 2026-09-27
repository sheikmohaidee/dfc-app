'use client';

import * as React from 'react';
import { Activity, Flame, MapPin, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { COPY } from '@dfc/core';
import { Button, Input } from '@/components/ui/primitives';
import { useAuth } from '@/lib/auth';

export function SignIn() {
  const { signIn, enterDemoMode } = useAuth();
  const [email, setEmail] = React.useState('admin@dfc.test');
  const [password, setPassword] = React.useState('dfc-admin-2026');
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
    <main className="relative min-h-dvh flex items-center justify-center px-6 overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Dynamic Ambient Mesh Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/20 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-orange-500/15 blur-[128px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-emerald-500/10 blur-[160px]" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Flagship Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11.5px] font-semibold text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Tier-1 Madurai Dispatch Grid
          </div>

          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-2xl font-black text-white shadow-xl shadow-primary/25 border border-white/20">
              DFC
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {COPY.commandCenter.en}
            </h1>
            <p className="ta text-sm text-zinc-400">
              {COPY.commandCenter.ta}
            </p>
          </div>
        </div>

        {/* Form Deck */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/85 p-6 backdrop-blur-xl shadow-2xl space-y-5"
        >
          {/* Quick Demo Mode Hero Action */}
          <button
            type="button"
            onClick={enterDemoMode}
            className="group relative w-full overflow-hidden rounded-xl border border-primary/50 bg-gradient-to-r from-primary/20 via-blue-600/15 to-primary/25 p-3.5 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-primary text-white shadow">
                  <Zap className="size-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-white">Launch Standalone Simulator</span>
                    <span className="rounded bg-primary/30 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-200">1-CLICK</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">Explore live 3D tracking, H3 surge radar &amp; multi-order TSP</p>
                </div>
              </div>
              <Sparkles className="size-4 text-primary transition-transform group-hover:scale-125" />
            </div>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="absolute bg-zinc-900 px-3 text-[10.5px] font-semibold tracking-wider text-zinc-400 uppercase">
              Or Sign In with Staff Credentials
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Staff Email</label>
              <Input
                type="email"
                autoComplete="username"
                placeholder="admin@dfc.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 h-10 border-zinc-800 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 h-10 border-zinc-800 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-400">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
            disabled={busy}
          >
            {busy ? 'Authenticating…' : 'Sign In to Command Center'}
          </Button>

          {/* Platform Capability Badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Activity className="size-3 text-emerald-400" />
              <span>3.5G Crash SOS Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Flame className="size-3 text-orange-400" />
              <span>H3 Hex Surge Radar</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <MapPin className="size-3 text-blue-400" />
              <span>Indoor Wayfinding</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>Shift Fatigue Shield</span>
            </div>
          </div>
        </form>

        <p className="text-center text-[11.5px] text-zinc-400">
          Dinasari Food Courier · Madurai Operational Network · v0.1.0
        </p>
      </div>
    </main>
  );
}
