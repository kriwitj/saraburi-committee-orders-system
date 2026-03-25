import { NextRequest, NextResponse } from 'next/server';
import { getOrder, getAttachments, createAttachment } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';
import { genId } from '@/lib/utils';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
async function ensureDir() { await fs.mkdir(UPLOAD_DIR, { recursive: true }); }

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
    await ensureDir();
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    const ext = path.extname(file.name).toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];
    if (!allowed.includes(ext)) return NextResponse.json({ error: 'ไฟล์ไม่รองรับ' }, { status: 400 });
    const filename = `${genId()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buf);
    const fileType = ext === '.pdf' ? 'PDF' : ext.startsWith('.doc') ? 'WORD' : 'EXCEL';
    // Store filePath via extra field in queries
    const att = await (async () => {
      const { client, initDb } = await import('@/db/index');
      await initDb();
      const { genId: gid } = await import('@/lib/utils');
      const aid = gid();
      const n = new Date().toISOString().replace('T',' ').slice(0,19);
      await client.execute({ sql:'INSERT INTO attachments (id,order_id,filename,original_name,file_type,file_path,size,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        args:[aid,id,filename,file.name,fileType,filePath,buf.length,user.userId,n] });
      return { id:aid, orderId:id, filename, originalName:file.name, fileType, size:buf.length, createdAt:n };
    })();
    return NextResponse.json(att, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
