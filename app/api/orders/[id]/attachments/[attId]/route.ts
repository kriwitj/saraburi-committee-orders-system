import { NextRequest, NextResponse } from 'next/server';
import { deleteAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import { deleteFile } from '@/lib/storage';
import { db } from '@/db/index';
import { attachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ attId: string }> }) {
  try {
    const { attId } = await params;
    const [att] = await db.select().from(attachments).where(eq(attachments.id, attId));
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // แปลง relative URL → absolute URL ก่อน redirect
    const fileUrl = new URL(att.blobUrl, req.url);
    return NextResponse.redirect(fileUrl);
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
