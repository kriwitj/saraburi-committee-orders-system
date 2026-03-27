import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/db/index';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'กรุณากรอกชื่อ' }, { status: 400 });
    await db.update(agencies).set({ name: name.trim() }).where(eq(agencies.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.message?.includes('unique')) {
      return NextResponse.json({ error: 'หน่วยงานนี้มีอยู่แล้ว' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
