import { NextRequest, NextResponse } from 'next/server';
import { createMember } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; scId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { scId } = await params;
    const data = await req.json();
    const m = await createMember(scId, data);
    return NextResponse.json(m, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
