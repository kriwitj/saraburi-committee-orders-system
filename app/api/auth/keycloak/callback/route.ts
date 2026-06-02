import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, parseIdToken, isKeycloakEnabled } from '@/lib/keycloak';
import { getUserByEmail, createSSOUser } from '@/db/queries';
import { signToken, COOKIE_NAME } from '@/lib/auth';

const APP_URL = () => process.env.NEXTAUTH_URL || 'http://localhost:3000';

function redirect(path: string) {
  return NextResponse.redirect(new URL(path, APP_URL()));
}

export async function GET(req: NextRequest) {
  if (!isKeycloakEnabled()) return redirect('/login?error=sso_not_configured');

  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return redirect(`/login?error=${encodeURIComponent(error)}`);

  // CSRF: ตรวจ state ที่เราตั้งไว้ก่อน redirect ไป Keycloak
  const storedState = req.cookies.get('kc_state')?.value;
  if (!code || !state || state !== storedState) {
    return redirect('/login?error=invalid_state');
  }

  try {
    const tokens = await exchangeCode(code);
    const claims = parseIdToken(tokens.id_token);

    const email = claims.email?.toLowerCase().trim();
    if (!email) return redirect('/login?error=no_email');

    // หา user ในระบบ — ถ้ายังไม่มีให้สร้างใหม่ด้วย role VIEWER
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createSSOUser({
        email,
        name: claims.name || claims.preferred_username || null,
      });
    }

    // ออก session token ของเราเอง (เหมือน login ปกติ)
    const token = await signToken({
      userId:   user.id,
      email:    user.email,
      role:     user.role,
      name:     user.name ?? null,
      agencyId: user.agencyId ?? null,
    });

    const res = redirect('/orders');
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });
    res.cookies.delete('kc_state');
    return res;

  } catch (e) {
    console.error('[Keycloak callback]', e);
    return redirect('/login?error=sso_failed');
  }
}
