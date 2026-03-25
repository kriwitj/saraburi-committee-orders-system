import { NextRequest, NextResponse } from 'next/server';
import { deleteAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import fs from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; attId: string }> }) {
  try {
    const { attId } = await params;
    // filePath stored; serve file
    const { client } = await import('@/db/index');
    const rows = await client.execute({ sql: 'SELECT * FROM attachments WHERE id=?', args: [attId] });
    if (!rows.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const att = rows.rows[0] as unknown as { file_path: string; original_name: string; file_type: string };
    const buf = await fs.readFile(att.file_path);
    const ct = att.file_type === 'PDF' ? 'application/pdf'
      : att.file_type === 'WORD'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/octet-stream';
    const fn = encodeURIComponent(att.original_name);
    return new NextResponse(buf as unknown as BodyInit, {
      headers: { 'Content-Type': ct, 'Content-Disposition': `inline; filename*=UTF-8''${fn}` },
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ attId: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { attId } = await params;
    const filePath = await deleteAttachment(attId);
    try { await fs.unlink(filePath); } catch {}
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
