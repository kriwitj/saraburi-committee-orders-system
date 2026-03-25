import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    // Sanitize: only allow alphanumeric, dash, dot
    if (!/^[\w\-\.]+$/.test(filename)) return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    const filePath = path.join(UPLOAD_DIR, filename);
    const buf = await fs.readFile(filePath);
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
