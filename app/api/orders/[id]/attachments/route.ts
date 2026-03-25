import { NextRequest, NextResponse } from 'next/server';
import { getOrder, getAttachments, createAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { genId } from '@/lib/utils';
import path from 'path';

const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await getAttachments(id));
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ error: 'ไฟล์ไม่รองรับ' }, { status: 400 });

    const filename = `${genId()}${ext}`;
    const fileType = ext === '.pdf' ? 'PDF' : ext.startsWith('.doc') ? 'WORD' : 'EXCEL';

    const blobUrl = await uploadFile(file, filename);

    const att = await createAttachment(
      id,
      { filename, originalName: file.name, fileType, blobUrl, size: file.size },
      user.userId,
    );
    return NextResponse.json(att, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
