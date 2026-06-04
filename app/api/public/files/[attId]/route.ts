import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { db } from '@/db/index';
import { attachments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from '@/lib/storage';

export async function GET(_: NextRequest, { params }: { params: Promise<{ attId: string }> }) {
  try {
    const { attId } = await params;
    const [att] = await db.select().from(attachments).where(eq(attachments.id, attId));
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ไฟล์ส่วนตัว — ต้อง login เพื่อดูผ่าน /api/orders/.../attachments/[attId]
    if (att.isPublic === 0) {
      return NextResponse.json({ error: 'ไฟล์นี้เป็นส่วนตัว กรุณาเข้าสู่ระบบก่อน' }, { status: 403 });
    }

    const filename = att.blobUrl.startsWith('/api/files/')
      ? att.blobUrl.replace('/api/files/', '')
      : path.basename(att.blobUrl);

    const buf = await readFile(filename);
    const ext = path.extname(filename).toLowerCase();
    const ct = ext === '.pdf'  ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : ext === '.doc'  ? 'application/msword'
      : ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream';

    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        'Content-Type': ct,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(att.originalName || filename)}`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
