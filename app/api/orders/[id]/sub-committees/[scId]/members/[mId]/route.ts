import { NextRequest, NextResponse } from 'next/server';
import { updateMember, deleteMember } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ mId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { mId } = await params;
    const data = await req.json();
    await updateMember(mId, data);
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ mId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { mId } = await params;
    await deleteMember(mId);
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
