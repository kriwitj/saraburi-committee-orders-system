import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, createAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import { put } from '@vercel/blob';
import { genId } from '@/lib/utils';
import path from 'path';
import type { UserRole } from '@/types';

const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];

export async function GET() {
  try {
    const user = await getAuthUser();
    const orders = await getOrders((user?.role as UserRole) || 'VIEWER');
    return NextResponse.json(orders);
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const form = await req.formData();
    const orderDataStr = form.get('orderData') as string | null;
    const file = form.get('file') as File | null;

    if (!orderDataStr) return NextResponse.json({ error: 'Missing orderData' }, { status: 400 });
    if (!file) return NextResponse.json({ error: 'ต้องแนบไฟล์คำสั่ง' }, { status: 400 });

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ error: 'ไฟล์ไม่รองรับ' }, { status: 400 });

    const data = JSON.parse(orderDataStr);
    const order = await createOrder(data, user.userId);

    const filename = `${genId()}${ext}`;
    const fileType = ext === '.pdf' ? 'PDF' : ext.startsWith('.doc') ? 'WORD' : 'EXCEL';
    const blob = await put(filename, file, { access: 'public' });
    await createAttachment(
      order.id,
      { filename, originalName: file.name, fileType, blobUrl: blob.url, size: file.size },
      user.userId,
    );

    // Return order with attachment
    const { getOrder } = await import('@/db/queries');
    const full = await getOrder(order.id);
    return NextResponse.json(full, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
