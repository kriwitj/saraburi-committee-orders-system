import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, createAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { genId } from '@/lib/utils';
import path from 'path';
import type { UserRole } from '@/types';

const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Magic bytes signatures — prevents renamed executables masquerading as documents
const MAGIC: Record<string, number[]> = {
  '.pdf':  [0x25, 0x50, 0x44, 0x46],        // %PDF
  '.docx': [0x50, 0x4B, 0x03, 0x04],         // PK (ZIP-based Office)
  '.xlsx': [0x50, 0x4B, 0x03, 0x04],
  '.doc':  [0xD0, 0xCF, 0x11, 0xE0],         // OLE2
  '.xls':  [0xD0, 0xCF, 0x11, 0xE0],
};

function validMagic(buf: Uint8Array, ext: string): boolean {
  const sig = MAGIC[ext];
  return sig ? sig.every((b, i) => buf[i] === b) : false;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orders = await getOrders(user.role as UserRole);
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
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: `ไฟล์ "${file.name}" ใหญ่เกิน 10MB` }, { status: 400 });
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      if (!validMagic(head, ext)) return NextResponse.json({ error: `ไฟล์ "${file.name}" ไม่ใช่ประเภทที่รองรับ` }, { status: 400 });
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
