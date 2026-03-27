'use client';
import { useMemo, useState, useEffect } from 'react';
import type { Order, OrderStatus } from '@/types';
import { getTypeColor, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { Badge, StatusBadge, Btn, ConfirmModal, Empty, Toast } from './ui';
import { OrderForm } from './forms';
import { formatThDate, thYear } from '@/lib/utils';
import { useAuth } from './providers';
import { useSettings } from './providers';

const PAGE_SIZE = 5;

interface Props { orders: Order[]; onSelect: (id: string) => void; onRefresh: () => void; }

// ── Pagination ──────────────────────────────────────────────────────
function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;

  function pages(): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const p = current;
    const items: (number | '…')[] = [1];
    if (p > 3) items.push('…');
    for (let i = Math.max(2, p - 1); i <= Math.min(total - 1, p + 1); i++) items.push(i);
    if (p < total - 2) items.push('…');
    items.push(total);
    return items;
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
      <button
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white
          hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >←</button>
      {pages().map((p, i) => p === '…'
        ? <span key={`e${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
        : (
          <button key={p} onClick={() => onChange(p as number)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer
              ${p === current
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            {p}
          </button>
        )
      )}
      <button
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white
          hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >→</button>
      <span className="text-xs text-gray-400 ml-1">{current}/{total}</span>
    </div>
  );
}

export function ListView({ orders, onSelect, onRefresh }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const canEdit = user?.role !== 'VIEWER';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok'|'err' } | null>(null);

  const notify = (msg: string, type: 'ok'|'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const years = useMemo(() =>
    [...new Set(orders.map(o => thYear(o.orderDate)).filter(Boolean))].sort((a,b) => parseInt(b)-parseInt(a)), [orders]);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || (o.orderNumber||'').toLowerCase().includes(q) || (o.title||'').toLowerCase().includes(q) || (o.signedBy||'').toLowerCase().includes(q))
      && (!filterType || o.type === filterType)
      && (!filterStatus || o.status === filterStatus)
      && (!filterYear || thYear(o.orderDate) === filterYear);
  }), [orders, search, filterType, filterStatus, filterYear]);

  useEffect(() => { setCurrentPage(1); }, [search, filterType, filterStatus, filterYear]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function addOrder(data: object, files?: File[]) {
    const form = new FormData();
    form.append('orderData', JSON.stringify(data));
    files?.forEach(f => form.append('file', f));
    const r = await fetch('/api/orders', { method: 'POST', body: form });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setModal(null); onRefresh();
    notify('เพิ่มคำสั่งแล้ว');
    onSelect(d.id);
  }

  async function doDelete() {
    if (!delId) return;
    setDelBusy(true);
    const r = await fetch(`/api/orders/${delId}`, { method: 'DELETE' });
    setDelBusy(false); setDelId(null);
    if (r.ok) { onRefresh(); notify('ลบแล้ว'); }
    else notify('ลบไม่สำเร็จ (เฉพาะ Admin)', 'err');
  }

  const statuses: OrderStatus[] = user?.role === 'ADMIN'
    ? ['ACTIVE', 'DRAFT', 'CANCELLED', 'DELETED']
    : ['ACTIVE', 'DRAFT', 'CANCELLED'];

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {settings.orderTypes.map(t => {
          const cnt = orders.filter(o => o.type === t).length;
          const c = getTypeColor(t);
          return (
            <div key={t} className="bg-white rounded-xl px-3 py-2.5 shadow-sm cursor-pointer hover:shadow-md transition-all"
              style={{ borderTop: `3px solid ${c}` }}
              onClick={() => setFilterType(filterType === t ? '' : t)}>
              <div className="text-xl font-black" style={{ color: c }}>{cnt}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">{t}</div>
            </div>
          );
        })}
        <div className="bg-white rounded-xl px-3 py-2.5 shadow-sm" style={{ borderTop: '3px solid #374151' }}>
          <div className="text-xl font-black text-gray-700">{orders.length}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">ทั้งหมด</div>
        </div>
      </div>

      {/* Status mini-stats */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {statuses.map(s => {
          const cnt = orders.filter(o => o.status === s).length;
          if (!cnt) return null;
          const c = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${filterStatus === s ? 'ring-2 ring-offset-1' : ''}`}
              style={{ background: c+'18', color: c, borderColor: c+'44' }}>
              {STATUS_LABELS[s]}: {cnt}
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl p-2.5 shadow-sm mb-3 flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  ค้นหาเลขคำสั่ง ชื่อเรื่อง ผู้ลงนาม ..."
          className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">ทุกประเภท</option>
          {settings.orderTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">ทุกปี</option>
          {years.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
        </select>
        {(search||filterType||filterStatus||filterYear) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setFilterYear(''); }}
            className="bg-red-50 text-red-600 border border-red-100 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-red-100 transition-colors">
            ✕ ล้าง
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}/{orders.length}</span>
        {canEdit && <Btn size="sm" onClick={() => setModal('addOrder')}>+ เพิ่มคำสั่ง</Btn>}
      </div>

      {/* List */}
      {filtered.length === 0
        ? <div className="bg-white rounded-xl shadow-sm"><Empty icon="🔍" text="ไม่พบรายการ" sub="ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" /></div>
        : (
          <>
            <div className="flex flex-col gap-2">
              {paged.map(o => {
                const tColor = getTypeColor(o.type);
                const totalM = o.subCommittees.reduce((s, sc) => s + sc.members.length, 0);
                const isCancelled = o.status === 'CANCELLED';
                const hasFiles = (o.attachments?.length || 0) > 0;

                return (
                  <div key={o.id}
                    className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${isCancelled ? 'opacity-70' : ''}`}
                    style={{ borderLeft: `4px solid ${isCancelled ? '#9ca3af' : tColor}` }}>

                    {/* Main row */}
                    <div className="px-4 pt-3 pb-2 cursor-pointer" onClick={() => onSelect(o.id)}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <Badge color={tColor}>{o.type}</Badge>
                            <StatusBadge status={o.status} />
                            <span className="font-bold text-gray-900 text-sm">ที่ {o.orderNumber}</span>
                            {o.orderDate && <span className="text-xs text-gray-400">📅 {formatThDate(o.orderDate)}</span>}
                          </div>
                          <div className="text-sm font-medium text-gray-700 line-clamp-1">{o.title}</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-1">
                            <span>📁 {o.subCommittees.length} คณะย่อย</span>
                            <span>👥 {totalM} คน</span>
                            {o.signedBy && <span>✍️ {o.signedBy}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <Btn size="sm" variant="secondary" onClick={() => onSelect(o.id)}>ดูรายละเอียด</Btn>
                          {user?.role === 'ADMIN' && (
                            <Btn size="sm" variant="danger" onClick={() => setDelId(o.id)}>🗑</Btn>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Attachments — always visible */}
                    {hasFiles && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                        {o.attachments.map(att => (
                          <a key={att.id}
                            href={`/api/orders/${o.id}/attachments/${att.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                              bg-blue-50 text-blue-700 text-xs font-medium
                              hover:bg-blue-100 transition-colors border border-blue-100">
                            {att.fileType === 'PDF' ? '📄' : att.fileType === 'WORD' ? '📝' : '📊'}
                            <span className="max-w-40 truncate">{att.originalName}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-1">
              <p className="text-center text-xs text-gray-400 mt-2">
                แสดง {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
              </p>
              <Pagination current={currentPage} total={totalPages} onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          </>
        )
      }

      {modal === 'addOrder' && <OrderForm onSave={addOrder} onClose={() => setModal(null)} />}
      {delId && <ConfirmModal text={`ต้องการลบคำสั่งนี้และข้อมูลทั้งหมดหรือไม่?\n"${orders.find(o=>o.id===delId)?.title}"`}
        onConfirm={doDelete} onClose={() => setDelId(null)} loading={delBusy} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
