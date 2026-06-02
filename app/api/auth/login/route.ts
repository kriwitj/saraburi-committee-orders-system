import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, seedIfEmpty } from '@/db/queries';
import { checkPassword, hashPassword, signToken, COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// Compute hash once per process — bcrypt is intentionally slow, avoid per-request cost
let _seedHash: string | null | undefined;
function getSeedHash(): string | null {
  if (_seedHash === undefined) {
    const pw = process.env.ADMIN_SEED_PASSWORD;
    _seedHash = pw ? hashPassword(pw) : null;
  }
  return _seedHash;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const rl = checkRateLimit(`login:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `พยายาม login มากเกินไป กรุณารอ ${Math.ceil((rl.retryAfter ?? 0) / 60)} นาที` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 900) } },
      );
    }

    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'กรุณากรอกข้อมูล' }, { status: 400 });

    // Seed admin only when ADMIN_SEED_PASSWORD env var is configured
    const seedHash = getSeedHash();
    if (seedHash) await seedIfEmpty(seedHash);

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user || !checkPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'อีเมล์หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id, email: user.email, role: user.role,
      name: user.name, agencyId: user.agencyId,
    });
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, agencyId: user.agencyId },
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
