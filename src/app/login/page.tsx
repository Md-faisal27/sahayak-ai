'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/landing/Navigation';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.configured) {
          setConfigError(
            'Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.'
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDetail(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to authenticate');
        setDetail(data.detail || data.hint || null);
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 flex items-center justify-center p-6 pt-28 noise-overlay">
        <div className="w-full max-w-md bg-background rounded-lg border border-foreground/10 p-8 sm:p-10 shadow-sm space-y-8">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-foreground/15 mx-auto p-0.5 bg-background flex items-center justify-center">
              <Image
                src="/logo-icon.png"
                alt="Sahayak AI Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
            <h1 className="text-3xl font-display tracking-tight text-foreground">
              Sign In to Studio
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              Enter your credentials to access syllabus assessments
            </p>
          </div>

          {configError && (
            <div className="p-4 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{configError}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded border border-foreground/20 bg-muted text-foreground text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
              <div className="space-y-1">
                <span className="block">{error}</span>
                {detail && <span className="block text-muted-foreground">{detail}</span>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="xyz@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-foreground/15 bg-muted/30 text-sm focus:outline-none focus:border-foreground text-foreground transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-foreground/15 bg-muted/30 text-sm focus:outline-none focus:border-foreground text-foreground transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-foreground text-background font-mono text-xs uppercase tracking-widest rounded-full transition-all hover:bg-foreground/90 flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In to Studio</span> <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs font-mono text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-foreground font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}