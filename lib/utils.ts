export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function nowIso(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function formatThDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  const thY = parseInt(y) > 2400 ? y : String(parseInt(y) + 543);
  return `${parseInt(d)} ${months[parseInt(m)]} ${thY}`;
}

export function thYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const y = parseInt(dateStr.split('-')[0] || '0');
  return y > 2400 ? String(y) : String(y + 543);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function apiUrl(path: string): string {
  return path;
}
