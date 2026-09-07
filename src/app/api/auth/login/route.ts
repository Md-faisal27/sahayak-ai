import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { createServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user from local DB
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    let token = '';

    // 2. If user has a passwordHash, verify with bcrypt
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
      token = generateToken(user);
    } else if (isSupabaseConfigured()) {
      // Authenticate against Supabase Auth
      try {
        const supabase = createServiceRoleClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (authError || !authData.user || !authData.session) {
          return NextResponse.json(
            { error: 'Invalid email or password.', detail: authError?.message },
            { status: 401 }
          );
        }
        token = authData.session.access_token;
      } catch (err: any) {
        return NextResponse.json(
          { error: 'Authentication failed.', detail: err?.message },
          { status: 401 }
        );
      }
    } else {
      // Fallback: If no password hash and local mode, set their password now
      const newHash = await bcrypt.hash(password, 10);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      token = generateToken(user);
    }

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      message: 'Login successful',
    });
    if (token) {
      setAuthCookie(response, token);
    }
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Login failed',
      },
      { status: 500 }
    );
  }
}