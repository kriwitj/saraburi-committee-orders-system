import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, seedIfEmpty } from '@/db/queries';
import { checkPassword, hashPassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'กรุณากรอกข้อมูล' }, { status: 400 });

    // seed admin on very first login
    await seedIfEmpty(hashPassword('Admin@1234'));

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user || !checkPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'อีเมล์หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
