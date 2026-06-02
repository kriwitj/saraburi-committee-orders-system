import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from '@/lib/storage';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { filename } = await params;
    // Sanitize: only allow alphanumeric, dash, dot
    if (!/^[\w\-\.]+$/.test(filename)) return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    const buf = await readFile(filename);
    const ext = path.extname(filename).toLowerCase();
    const ct = ext === '.pdf' ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : ext === '.doc' ? 'application/msword'
      : ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/octet-stream';
    return new NextResponse(buf as unknown as BodyInit, { headers: { 'Content-Type': ct } });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
