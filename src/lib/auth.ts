import { createServerSupabaseClient, isSupabaseConfigured } from './supabase';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from './db';

const TOKEN_COOKIE = 'sahayak_auth_token';
const JWT_SECRET = process.env.JWT_SECRET || 'sahayak_ai_super_secret_jwt_key_2026_hackathon';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export function generateToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign(
    { userId: user.id, id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(TOKEN_COOKIE)?.value;
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  }

  if (!token) return null;

  // 1. Try local JWT token verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && (decoded.email || decoded.id || decoded.userId)) {
      const appUser = await db.user.findFirst({
        where: {
          OR: [
            ...(decoded.email ? [{ email: decoded.email }] : []),
            ...(decoded.id ? [{ id: decoded.id }] : []),
            ...(decoded.userId ? [{ id: decoded.userId }] : []),
          ],
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
      if (appUser) return appUser;
    }
  } catch {
    // Not a local JWT or expired, check Supabase next if configured
  }

  // 2. Try Supabase Auth verification if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user && user.email) {
        const appUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, email: true, name: true, createdAt: true },
        });
        if (appUser) return appUser;
      }
    } catch (err) {
      console.error('Supabase auth verification failed:', err);
    }
  }

  return null;
}

/**
 * Set the Supabase session access token on the response cookie.
 *
 * We mirror the access token under `sahayak_auth_token` so that
 * `getCurrentUser` can read it consistently across both server components and
 * route handlers. The Supabase SSR client also manages its own session cookie.
 */
export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function removeAuthCookie(res: NextResponse) {
  res.cookies.set({
    name: TOKEN_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}