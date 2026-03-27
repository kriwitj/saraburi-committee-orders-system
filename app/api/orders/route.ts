import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, createAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
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
    const files = form.getAll('file') as File[];

    if (!orderDataStr) return NextResponse.json({ error: 'Missing orderData' }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: 'ต้องแนบไฟล์คำสั่งอย่างน้อย 1 ไฟล์' }, { status: 400 });

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ error: `ไฟล์ "${file.name}" ไม่รองรับ` }, { status: 400 });
    }

    const data = JSON.parse(orderDataStr);
    const order = await createOrder(data, user.userId);

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      const filename = `${genId()}${ext}`;
      const fileType = ext === '.pdf' ? 'PDF' : ext.startsWith('.doc') ? 'WORD' : 'EXCEL';
      const blobUrl = await uploadFile(file, filename);
      await createAttachment(
        order.id,
        { filename, originalName: file.name, fileType, blobUrl, size: file.size },
        user.userId,
      );
    }

    const { getOrder } = await import('@/db/queries');
    const full = await getOrder(order.id);
    return NextResponse.json(full, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
