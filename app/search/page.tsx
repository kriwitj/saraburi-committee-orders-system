'use client';
import { useState, useEffect, useMemo } from 'react';
import { formatThDate, thYear } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

interface PublicOrder {
  id: string;
  orderNumber: string;
  orderDate: string | null;
  type: string;
  title: string;
  signedBy: string | null;
  signedByTitle: string | null;
  status: string;
  agencyId: string | null;
  subCommitteesCount: number;
  membersCount: number;
  attachments: { id: string; originalName: string; fileType: string; blobUrl: string }[];
}
interface Agency { id: string; name: string; }

const TYPE_COLORS: Record<string, string> = {
  'คณะกรรมการ': '#1e40af', 'คณะทำงาน': '#065f46', 'คณะอนุกรรมการ': '#92400e',
};
function typeColor(t: string) { return TYPE_COLORS[t] || '#4b5563'; }

const PAGE_SIZE = 5;

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | '…')[] = (() => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const items: (number | '…')[] = [1];
    if (current > 3) items.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) items.push(i);
    if (current < total - 2) items.push('…');
    items.push(total);
    return items;
  })();
  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      <button disabled={current <= 1} onClick={() => onChange(current - 1)}
        className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50
          disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">←</button>
      {pages.map((p, i) => p === '…'
        ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
        : <button key={p} onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold cursor-pointer transition-colors
              ${p === current ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{p}</button>
      )}
      <button disabled={current >= total} onClick={() => onChange(current + 1)}
        className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50
          disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">→</button>
    </div>
  );
}

export default function SearchPage() {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterAgency, setFilterAgency] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/orders').then(r => r.ok ? r.json() : []),
      fetch('/api/agencies').then(r => r.ok ? r.json() : []),
    ]).then(([ords, ags]) => { setOrders(ords); setAgencies(ags); }).finally(() => setLoading(false));
  }, []);

  const types = useMemo(() => [...new Set(orders.map(o => o.type))].sort(), [orders]);
  const years = useMemo(() =>
    [...new Set(orders.map(o => thYear(o.orderDate)).filter(Boolean))].sort((a, b) => parseInt(b) - parseInt(a)), [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(o =>
      (!q || (o.orderNumber||'').toLowerCase().includes(q) || (o.title||'').toLowerCase().includes(q) || (o.signedBy||'').toLowerCase().includes(q))
      && (!filterType || o.type === filterType)
      && (!filterYear || thYear(o.orderDate) === filterYear)
      && (!filterAgency || o.agencyId === filterAgency)
    );
  }, [orders, search, filterType, filterYear, filterAgency]);

  useEffect(() => { setCurrentPage(1); }, [search, filterType, filterYear, filterAgency]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilter = !!(search || filterType || filterYear || filterAgency);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-xl">📋</span>
              <div>
                <div className="font-extrabold text-sm leading-tight">ระบบคำสั่งจังหวัดสระบุรี</div>
                <div className="text-slate-400 text-xs">ค้นหาคำสั่งสาธารณะ</div>
              </div>
            </a>
          </div>
          <a href="/login"
            className="text-xs bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg
              hover:bg-white/20 transition-colors">
            เข้าสู่ระบบ →
          </a>
        </div>
      </header>

      {/* Search hero */}
      <div className="bg-blue-700 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-extrabold mb-1">ค้นหาคำสั่งจังหวัดสระบุรี</h1>
          <p className="text-blue-200 text-sm mb-5">ค้นหาคำสั่งแต่งตั้งคณะกรรมการ คณะทำงาน สาธารณะ</p>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  พิมพ์เลขคำสั่ง ชื่อเรื่อง หรือชื่อผู้ลงนาม ..."
            className="w-full bg-white text-gray-900 rounded-xl px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-gray-600">กรองตาม:</span>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">ทุกประเภท</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">ทุกปี</option>
            {years.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
          </select>
          <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 max-w-xs">
            <option value="">ทุกหน่วยงาน</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {hasFilter && (
            <button onClick={() => { setSearch(''); setFilterType(''); setFilterYear(''); setFilterAgency(''); }}
              className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 cursor-pointer transition-colors">
              ✕ ล้างทั้งหมด
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} รายการ</span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl animate-spin mb-3">⟳</div>
            <p className="text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-14 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p className="font-semibold text-gray-500">{hasFilter ? 'ไม่พบรายการที่ตรงกัน' : 'ยังไม่มีคำสั่งในระบบ'}</p>
            {hasFilter && <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {paged.map(o => {
                const tc = typeColor(o.type);
                const sc = STATUS_COLORS[o.status as keyof typeof STATUS_COLORS] || '#374151';
                return (
                  <div key={o.id} className="bg-white rounded-xl shadow-sm overflow-hidden"
                    style={{ borderLeft: `4px solid ${tc}` }}>
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded border"
                          style={{ background: tc+'18', color: tc, borderColor: tc+'44' }}>{o.type}</span>
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded border"
                          style={{ background: sc+'18', color: sc, borderColor: sc+'44' }}>
                          {STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] || o.status}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">ที่ {o.orderNumber}</span>
                        {o.orderDate && <span className="text-xs text-gray-400">📅 {formatThDate(o.orderDate)}</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">{o.title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                        <span>📁 {o.subCommitteesCount} คณะย่อย · 👥 {o.membersCount} คน</span>
                        {o.signedBy && <span>✍️ {o.signedBy}</span>}
                        {agencies.find(a => a.id === o.agencyId) && (
                          <span>🏢 {agencies.find(a => a.id === o.agencyId)?.name}</span>
                        )}
                      </div>
                    </div>
                    {o.attachments.length > 0 && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {o.attachments.map(att => (
                          <a key={att.id}
                            href={att.blobUrl}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                              bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100
                              transition-colors border border-blue-100">
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

            {totalPages > 1 && (
              <div className="mt-2">
                <p className="text-center text-xs text-gray-400 mb-2">
                  แสดง {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
                </p>
                <Pagination current={currentPage} total={totalPages}
                  onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center py-6 text-gray-400 text-xs border-t border-gray-200 bg-white mt-8">
        จังหวัดสระบุรี · ระบบคำสั่งออนไลน์ ·{' '}
        <a href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบสำหรับเจ้าหน้าที่</a>
      </footer>
    </div>
  );
}
