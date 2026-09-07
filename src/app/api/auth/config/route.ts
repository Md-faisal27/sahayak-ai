import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/auth/config
 *
 * Returns whether authentication is configured (local SQLite or Supabase).
 */
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  const isSupabase = isSupabaseConfigured();
  const hasDb = Boolean(databaseUrl);

  let reachable: boolean | null = null;
  let reachError: string | null = null;

  if (isSupabase && supabaseUrl && anonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: anonKey.trim() },
      });
      reachable = res.ok;
      if (!res.ok) {
        reachError = `HTTP ${res.status}`;
      }
    } catch (err: any) {
      reachable = false;
      reachError = err?.message || 'Network error';
    }
  }

  return NextResponse.json({
    configured: true, // Application is configured and ready (via local SQLite or Supabase)
    isLocalMode: !isSupabase,
    supabaseConfigured: isSupabase,
    hasDatabaseUrl: hasDb,
    reachable: isSupabase ? reachable : true,
    reachError,
    mode: isSupabase ? 'supabase' : 'local',
  });
}