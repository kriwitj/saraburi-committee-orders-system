import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { orders } from '@/db/schema';
import { ne, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(orders).where(ne(orders.status, 'DELETED'));
    return NextResponse.json({ orders: Number(count) });
  } catch (e) { console.error(e); return NextResponse.json({ orders: 0 }); }
}
