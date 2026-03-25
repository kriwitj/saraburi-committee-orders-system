import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/db/queries';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json(await getUsers());
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { email, name, password, role } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    const id = await createUser(email.toLowerCase().trim(), name || '', hashPassword(password), role || 'VIEWER');
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'อีเมล์นี้มีอยู่แล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
