'use client';
import { useEffect, useState, useMemo } from 'react';
import { formatThDate, thYear } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

interface PublicOrder {
  id: string;
  orderNumber: string;
  orderDate: string | null;
  type: string;
  title: string;
  signedBy: string | null;
  status: string;
  agencyId: string | null;
  subCommitteesCount: number;
  membersCount: number;
  attachments: { id: string; originalName: string; fileType: string; blobUrl: string }[];
}
interface AuthUser { name: string | null; email: string; role: string; }
interface Agency { id: string; name: string; }

const ROLE_LABELS: Record<string, string> = { ADMIN: 'ผู้ดูแลระบบ', EDITOR: 'ผู้แก้ไข', VIEWER: 'ผู้ชม' };
const TYPE_COLORS: Record<string, string> = {
  'คณะกรรมการ': '#1e40af', 'คณะทำงาน': '#065f46', 'คณะอนุกรรมการ': '#92400e',
};
function tc(type: string) { return TYPE_COLORS[type] || '#4b5563'; }

const FEATURES = [
  { icon: '📋', title: 'จัดการคำสั่ง', desc: 'สร้าง แก้ไข และติดตามสถานะคำสั่งได้ครบถ้วน' },
  { icon: '👥', title: 'รายชื่อคณะ', desc: 'บริหารจัดการรายชื่อกรรมการในแต่ละคณะย่อย' },
  { icon: '📎', title: 'แนบไฟล์คำสั่ง', desc: 'แนบ PDF, Word, Excel พร้อมดาวน์โหลดได้ทันที' },
  { icon: '📊', title: 'ส่งออกเอกสาร', desc: 'ส่งออกรายชื่อคณะกรรมการเป็นไฟล์ Word หรือ Excel' },
];

const PAGE_SIZE = 5;

// ── Mini Pagination ────────────────────────────────────────────────
function MiniPagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
      <button disabled={current <= 1} onClick={() => onChange(current - 1)}
        className="px-3 py-1 rounded-lg text-xs border border-white/20 bg-white/5 text-white
          hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
        ←
      </button>
      {Array.from({ length: Math.min(total, 7) }, (_, i) => {
        // Show pages around current
        let p: number;
        if (total <= 7) p = i + 1;
        else if (current <= 4) p = i + 1;
        else if (current >= total - 3) p = total - 6 + i;
        else p = current - 3 + i;
        return (
          <button key={p} onClick={() => onChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${p === current
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 border border-white/15 text-slate-300 hover:bg-white/15'}`}>
            {p}
          </button>
        );
      })}
      <button disabled={current >= total} onClick={() => onChange(current + 1)}
        className="px-3 py-1 rounded-lg text-xs border border-white/20 bg-white/5 text-white
          hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
        →
      </button>
      <span className="text-slate-500 text-xs ml-1">{current}/{total}</span>
    </div>
  );
}

export default function LandingPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => setAuthUser(d?.user ?? null))
      .catch(() => setAuthUser(null));
    Promise.all([
      fetch('/api/public/orders').then(r => r.ok ? r.json() : []),
      fetch('/api/agencies').then(r => r.ok ? r.json() : []),
    ]).then(([ords, ags]) => { setOrders(ords); setAgencies(ags); })
      .finally(() => setOrdersLoading(false));
  }, []);

  const types = useMemo(() => [...new Set(orders.map(o => o.type))].sort(), [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(o =>
      (!q || (o.orderNumber||'').toLowerCase().includes(q) || (o.title||'').toLowerCase().includes(q) || (o.signedBy||'').toLowerCase().includes(q))
      && (!filterType || o.type === filterType)
    );
  }, [orders, search, filterType]);

  useEffect(() => { setCurrentPage(1); }, [search, filterType]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="border-b border-white/10 sticky top-0 z-30 bg-slate-900/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-base shrink-0">📋</div>
            <div>
              <div className="font-extrabold text-sm leading-tight">ระบบคำสั่งจังหวัดสระบุรี</div>
              <div className="text-slate-400 text-xs hidden sm:block">คณะกรรมการ / คณะทำงาน</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/search"
              className="text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors hidden sm:block">
              🔍 ค้นหา
            </a>
            {authUser === undefined ? (
              <div className="w-24 h-8 rounded-lg bg-white/10 animate-pulse" />
            ) : authUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/15 rounded-lg px-3 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {(authUser.name || authUser.email)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-tight">{authUser.name || authUser.email}</div>
                    <div className="text-slate-400 text-xs">{ROLE_LABELS[authUser.role]}</div>
                  </div>
                </div>
                <a href="/orders" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition-colors">
                  จัดการ →
                </a>
              </div>
            ) : (
              <a href="/login" className="bg-white text-slate-900 font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-slate-100 transition-colors">
                เข้าสู่ระบบ
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-black mb-3 leading-tight">
          ระบบบริหารจัดการ<br />
          <span className="text-blue-400">คำสั่งจังหวัดสระบุรี</span>
        </h1>
        <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto">
          ศูนย์กลางคำสั่งแต่งตั้งคณะกรรมการ คณะทำงาน และคณะอนุกรรมการ
        </p>
        {orders.length > 0 && (
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 mb-8">
            <span className="text-4xl font-black">{orders.length}</span>
            <span className="text-slate-400 text-sm text-left">คำสั่ง<br />สาธารณะ</span>
          </div>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="/search" className="bg-white text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-lg">
            🔍 ค้นหาคำสั่ง
          </a>
          {authUser ? (
            <a href="/orders" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-500 transition-colors">
              เข้าหน้าจัดการ →
            </a>
          ) : (
            <a href="/login" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-500 transition-colors">
              เข้าสู่ระบบ →
            </a>
          )}
        </div>
      </div>

      {/* ── Order List ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-slate-200">
            คำสั่งในระบบ
            {!ordersLoading && <span className="text-slate-500 font-normal text-sm ml-2">({filtered.length} รายการ)</span>}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา..."
              className="bg-white/10 border border-white/15 text-white placeholder:text-slate-500
                rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-44" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="bg-white/10 border border-white/15 text-white rounded-lg px-3 py-1.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="" className="bg-slate-800">ทุกประเภท</option>
              {types.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
            </select>
          </div>
        </div>

        {ordersLoading ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            <div className="animate-spin text-2xl mb-2">⟳</div>กำลังโหลด...
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">ไม่พบรายการ</div>
        ) : (
          <>
            <div className="grid gap-3">
              {paged.map(o => {
                const c = tc(o.type);
                const sc = STATUS_COLORS[o.status as keyof typeof STATUS_COLORS] || '#6b7280';
                const agencyName = agencies.find(a => a.id === o.agencyId)?.name;
                return (
                  <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden
                    hover:bg-white/8 transition-colors" style={{ borderLeft: `3px solid ${c}` }}>
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: c+'30', color: c+'cc' }}>{o.type}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: sc+'30', color: sc+'cc' }}>
                          {STATUS_LABELS[o.status as keyof typeof STATUS_LABELS]}
                        </span>
                        <span className="font-bold text-sm">ที่ {o.orderNumber}</span>
                        {o.orderDate && <span className="text-xs text-slate-500">📅 {formatThDate(o.orderDate)}</span>}
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-1 mb-1">{o.title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        {agencyName && <span>🏢 {agencyName}</span>}
                        <span>📁 {o.subCommitteesCount} คณะย่อย · 👥 {o.membersCount} คน</span>
                        {o.signedBy && <span>✍️ {o.signedBy}</span>}
                      </div>
                    </div>
                    {o.attachments.length > 0 && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {o.attachments.map(att => (
                          <a key={att.id}
                            href={att.blobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                              bg-blue-900/40 text-blue-300 text-xs font-medium
                              hover:bg-blue-800/60 transition-colors border border-blue-700/30">
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
            {totalPages > 1 && (
              <>
                <p className="text-center text-xs text-slate-500 mt-4">
                  แสดง {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
                </p>
                <MiniPagination current={currentPage} total={totalPages} onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </>
            )}
          </>
        )}

        <div className="text-center mt-5">
          <a href="/search" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            🔍 ค้นหาพร้อม filter ละเอียด →
          </a>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <div className="border-t border-white/10 bg-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-center font-bold text-slate-300 mb-6">ฟีเจอร์หลักของระบบ</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center py-5 text-slate-600 text-xs border-t border-white/5">
        จังหวัดสระบุรี · ระบบคำสั่งออนไลน์
      </footer>
    </div>
  );
}
