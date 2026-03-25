'use client';
import { useState } from 'react';
import type { Attachment } from '@/types';
import { Btn, ConfirmModal } from './ui';
import { formatBytes } from '@/lib/utils';
import { useAuth } from './providers';

const TYPE_ICONS: Record<string, string> = { PDF: '📄', WORD: '📝', EXCEL: '📊' };

export function AttachmentsPanel({ orderId, attachments, onRefresh }: {
  orderId: string; attachments: Attachment[]; onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [err, setErr] = useState('');

  const canEdit = user?.role !== 'VIEWER';

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr('');
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(`/api/orders/${orderId}/attachments`, { method: 'POST', body: form });
    const d = await r.json();
    setUploading(false);
    if (!r.ok) { setErr(d.error || 'อัปโหลดไม่สำเร็จ'); return; }
    onRefresh();
    e.target.value = '';
  }

  async function doDelete() {
    if (!delId) return;
    setDelBusy(true);
    await fetch(`/api/orders/${orderId}/attachments/${delId}`, { method: 'DELETE' });
    setDelBusy(false); setDelId(null);
    onRefresh();
  }

  return (
    <div>
      {err && <p className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded">{err}</p>}

      {canEdit && (
        <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors mb-3 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          <span className="text-blue-600">📎</span>
          <span className="text-sm text-gray-600">{uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อแนบไฟล์ (PDF, Word, Excel)'}</span>
          <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls" className="hidden" onChange={upload} disabled={uploading} />
        </label>
      )}

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีไฟล์แนบ</p>
      ) : (
        <div className="space-y-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xl flex-shrink-0">{TYPE_ICONS[att.fileType] || '📎'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{att.originalName}</div>
                <div className="text-xs text-gray-400">{att.fileType} · {formatBytes(att.size)}</div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <a href={`/api/orders/${orderId}/attachments/${att.id}`} target="_blank" rel="noreferrer">
                  <Btn size="sm" variant="secondary">⬇ เปิด</Btn>
                </a>
                {canEdit && <Btn size="sm" variant="danger" onClick={() => setDelId(att.id)}>🗑</Btn>}
              </div>
            </div>
          ))}
        </div>
      )}

      {delId && <ConfirmModal text="ต้องการลบไฟล์แนบนี้หรือไม่?" onConfirm={doDelete} onClose={() => setDelId(null)} loading={delBusy} />}
    </div>
  );
}
