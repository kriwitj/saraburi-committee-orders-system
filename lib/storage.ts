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
export async function uploadFile(file: File, filename: string): Promise<string> {
  await ensureDir();
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
  return `/api/files/${filename}`;
}

/**
 * ลบไฟล์จาก local filesystem
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url) return;
  if (url.startsWith('/api/files/')) {
    const filename = url.replace('/api/files/', '');
    try {
      await fs.unlink(path.join(UPLOAD_DIR, filename));
    } catch {
      /* ไฟล์อาจถูกลบไปแล้ว — ไม่ต้องทำอะไร */
    }
  }
}

/**
 * อ่านไฟล์จาก local filesystem (ใช้ใน /api/files/[filename] route)
 */
export async function readFile(filename: string): Promise<Buffer> {
  return fs.readFile(path.join(UPLOAD_DIR, filename));
}

/**
 * ตรวจสอบว่าไฟล์มีอยู่
 */
export async function fileExists(filename: string): Promise<boolean> {
  try {
    await fs.access(path.join(UPLOAD_DIR, filename));
    return true;
  } catch {
    return false;
  }
}
