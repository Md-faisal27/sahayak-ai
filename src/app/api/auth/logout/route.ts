import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST() {
  try {
    // Sign out from Supabase Auth (clears the session cookie)
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    // Continue with local cookie cleanup even if Supabase sign-out fails
    console.warn('Supabase sign-out error:', err);
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });
  removeAuthCookie(response);
  return response;
}