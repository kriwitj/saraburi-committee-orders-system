import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { buildAuthUrl, isKeycloakEnabled } from '@/lib/keycloak';

export async function GET() {
  if (!isKeycloakEnabled()) {
    return NextResponse.redirect(
      new URL('/login?error=sso_not_configured', process.env.NEXTAUTH_URL || 'http://localhost:3000'),
    );
  }

  const state = randomBytes(16).toString('hex');
  const authUrl = buildAuthUrl(state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set('kc_state', state, {
    httpOnly: true,
    sameSite: 'lax', // lax เพื่อให้ cookie ถูกส่งตอน redirect กลับจาก Keycloak
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 นาที
    path: '/',
  });
  return res;
}
