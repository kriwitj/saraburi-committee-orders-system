import { NextRequest, NextResponse } from 'next/server';
import { createSubCommittee } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const data = await req.json();
    const sc = await createSubCommittee(id, data);
    return NextResponse.json(sc, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
