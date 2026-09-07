import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { createServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, name, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    let token = '';

    // 1. If Supabase is configured with real credentials, register in Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const supabase = createServiceRoleClient();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { name: name.trim() },
        });

        if (authError) {
          const detail = authError.message;
          if (
            detail.includes('already registered') ||
            detail.includes('already been registered')
          ) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
          }
          console.warn('Supabase auth warning during signup:', detail);
        } else if (authData.user) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (signInData?.session?.access_token) {
            token = signInData.session.access_token;
          }
        }
      } catch (err: any) {
        console.warn('Supabase registration failed, falling back to local auth:', err?.message);
      }
    }

    // 2. Hash password with bcrypt and create app-level user in Prisma
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // 3. If no Supabase token, generate local signed JWT token
    if (!token) {
      token = generateToken(user);
    }

    const response = NextResponse.json({ user, message: 'Signup successful' }, { status: 201 });
    if (token) {
      setAuthCookie(response, token);
    }

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Signup failed',
      },
      { status: 500 }
    );
  }
}