import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await req.json();
    const order = await createOrder(data, user.userId);
    return NextResponse.json(order, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
