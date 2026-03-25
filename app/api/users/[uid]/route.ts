import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/db/queries';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { uid } = await params;
    const { name, role, password } = await req.json();
    await updateUser(uid, { name, role, passwordHash: password ? hashPassword(password) : undefined });
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { uid } = await params;
    if (uid === user.userId) return NextResponse.json({ error: 'ไม่สามารถลบตัวเองได้' }, { status: 400 });
    await deleteUser(uid);
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
