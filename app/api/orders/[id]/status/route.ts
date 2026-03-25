import { NextRequest, NextResponse } from 'next/server';
import { updateOrder } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const { status, cancelReason } = await req.json();
    const order = await updateOrder(id, { status, cancelReason });
    return NextResponse.json(order);
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
