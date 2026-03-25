import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload a file to Vercel Blob (production) or local filesystem (dev).
 * Returns the public URL to store in the database.
 */
export async function uploadFile(file: File, filename: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(filename, file, { access: 'public' });
    return blob.url;
  }

  // Local fallback for development
  await ensureDir();
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
  return `/api/files/${filename}`;
}

/**
 * Delete a file from Vercel Blob or local filesystem.
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url) return;
  if (url.startsWith('/api/files/')) {
    const filename = url.replace('/api/files/', '');
    try { await fs.unlink(path.join(UPLOAD_DIR, filename)); } catch { /* already gone */ }
  } else {
    try {
      const { del } = await import('@vercel/blob');
      await del(url);
    } catch { /* ignore */ }
  }
}
