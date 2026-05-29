import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { deleteAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import { deleteFile, readFile } from '@/lib/storage';
import { db } from '@/db/index';
import { attachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: Promise<{ attId: string }> }) {
  try {
    const { attId } = await params;
    const [att] = await db.select().from(attachments).where(eq(attachments.id, attId));
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ดึง filename จาก blobUrl แล้ว serve ไฟล์โดยตรง (ไม่ redirect)
    const filename = att.blobUrl.startsWith('/api/files/')
      ? att.blobUrl.replace('/api/files/', '')
      : path.basename(att.blobUrl);

    const buf = await readFile(filename);
    const ext = path.extname(filename).toLowerCase();
    const ct = ext === '.pdf' ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : ext === '.doc' ? 'application/msword'
      : ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream';

    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        'Content-Type': ct,
        'Content-Disposition': `inline; filename="${att.originalName || filename}"`,
      },
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ attId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { attId } = await params;
    const blobUrl = await deleteAttachment(attId);
    await deleteFile(blobUrl);
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
