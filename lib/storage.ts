import path from 'path';
import fs from 'fs/promises';

/**
 * UPLOAD_DIR: กำหนดจาก env var UPLOAD_DIR หรือใช้ ./uploads เป็นค่า default
 * ใน production (Docker) ให้ mount volume ไว้ที่ UPLOAD_DIR
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads');

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * บันทึกไฟล์ลง local filesystem และคืน URL สำหรับเก็บใน database
 */
function safeJoin(filename: string): string {
  const safe = path.basename(filename);
  const full = path.join(UPLOAD_DIR, safe);
  if (!full.startsWith(UPLOAD_DIR + path.sep) && full !== UPLOAD_DIR) {
    throw new Error('Path traversal detected');
  }
  return full;
}

export async function uploadFile(file: File, filename: string): Promise<string> {
  await ensureDir();
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(safeJoin(filename), buf);
  return `/api/files/${path.basename(filename)}`;
}

/**
 * ลบไฟล์จาก local filesystem
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url) return;
  if (url.startsWith('/api/files/')) {
    const filename = url.replace('/api/files/', '');
    try {
      await fs.unlink(safeJoin(filename));
    } catch {
      /* ไฟล์อาจถูกลบไปแล้ว — ไม่ต้องทำอะไร */
    }
  }
}

/**
 * อ่านไฟล์จาก local filesystem (ใช้ใน /api/files/[filename] route)
 */
export async function readFile(filename: string): Promise<Buffer> {
  return fs.readFile(safeJoin(filename));
}

/**
 * ตรวจสอบว่าไฟล์มีอยู่
 */
export async function fileExists(filename: string): Promise<boolean> {
  try {
    await fs.access(safeJoin(filename));
    return true;
  } catch {
    return false;
  }
}
