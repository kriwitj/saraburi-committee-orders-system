'use client';
import { useMemo, useState } from 'react';
import type { Order, OrderStatus } from '@/types';
import { getTypeColor, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { Badge, StatusBadge, Btn, ConfirmModal, Empty, Toast } from './ui';
import { OrderForm } from './forms';
import { formatThDate, thYear } from '@/lib/utils';
import { useAuth } from './providers';
import { useSettings } from './providers';

interface Props { orders: Order[]; onSelect: (id: string) => void; onRefresh: () => void; }

export function ListView({ orders, onSelect, onRefresh }: Props) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const canEdit = user?.role !== 'VIEWER';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
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

  async function addOrder(data: object, file?: File) {
    const form = new FormData();
    form.append('orderData', JSON.stringify(data));
    if (file) form.append('file', file);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {settings.orderTypes.map(t => {
          const cnt = orders.filter(o => o.type === t).length;
          const c = getTypeColor(t);
          return (
            <div key={t} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderTop: `3px solid ${c}` }}
              onClick={() => setFilterType(filterType === t ? '' : t)}>
              <div className="text-2xl font-black" style={{ color: c }}>{cnt}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{t}</div>
            </div>
          );
        })}
        <div className="bg-white rounded-xl p-4 shadow-sm" style={{ borderTop: '3px solid #374151' }}>
          <div className="text-2xl font-black text-gray-700">{orders.length}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">ทั้งหมด</div>
        </div>
      </div>

      {/* Status mini-stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => {
          const cnt = orders.filter(o => o.status === s).length;
          if (!cnt) return null;
          const c = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${filterStatus === s ? 'ring-2 ring-offset-1' : ''}`}
              style={{ background: c+'18', color: c, borderColor: c+'44' }}>
              {STATUS_LABELS[s]}: {cnt}
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl p-3.5 shadow-sm mb-4 flex flex-wrap gap-2.5 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  ค้นหาเลขคำสั่ง ชื่อเรื่อง ผู้ลงนาม ..."
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
          <option value="">ทุกประเภท</option>
          {settings.orderTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
          <option value="">ทุกปี</option>
          {years.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
        </select>
        {(search||filterType||filterStatus||filterYear) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setFilterYear(''); }}
            className="bg-red-50 text-red-600 border border-red-100 rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">✕ ล้าง</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}/{orders.length} รายการ</span>
        {canEdit && <Btn size="sm" onClick={() => setModal('addOrder')}>+ เพิ่มคำสั่ง</Btn>}
      </div>

      {/* List */}
      {filtered.length === 0
        ? <div className="bg-white rounded-xl shadow-sm"><Empty icon="🔍" text="ไม่พบรายการ" sub="ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" /></div>
        : <div className="flex flex-col gap-2.5">
            {filtered.map(o => {
              const tColor = getTypeColor(o.type);
              const totalM = o.subCommittees.reduce((s, sc) => s + sc.members.length, 0);
              const isCancelled = o.status === 'CANCELLED';
              return (
                <div key={o.id}
                  className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isCancelled ? 'opacity-70' : ''}`}
                  style={{ borderLeft: `4px solid ${isCancelled ? '#9ca3af' : tColor}` }}
                  onClick={() => onSelect(o.id)}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge color={tColor}>{o.type}</Badge>
                        <StatusBadge status={o.status} />
                        <span className="font-bold text-gray-900">ที่ {o.orderNumber}</span>
                        {o.orderDate && <span className="text-xs text-gray-400">📅 {formatThDate(o.orderDate)}</span>}
                        {o.attachments?.length > 0 && <span className="text-xs text-gray-400">📎 {o.attachments.length}</span>}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-2 line-clamp-2">{o.title}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>📁 {o.subCommittees.length} คณะย่อย</span>
                        <span>👥 {totalM} รายชื่อ</span>
                        {o.signedBy && <span>✍️ {o.signedBy}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <Btn size="sm" variant="secondary" onClick={() => onSelect(o.id)}>ดูรายละเอียด</Btn>
                      {user?.role === 'ADMIN' && <Btn size="sm" variant="danger" onClick={() => setDelId(o.id)}>🗑</Btn>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {modal === 'addOrder' && <OrderForm onSave={addOrder} onClose={() => setModal(null)} />}
      {delId && <ConfirmModal text={`ต้องการลบคำสั่งนี้และข้อมูลทั้งหมดหรือไม่?\n"${orders.find(o=>o.id===delId)?.title}"`}
        onConfirm={doDelete} onClose={() => setDelId(null)} loading={delBusy} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
