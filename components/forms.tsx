'use client';
import { useState, useEffect, useRef } from 'react';
import type { Order, SubCommittee, Member, Agency } from '@/types';
import { Modal, FG, Input, Textarea, Select, Btn } from './ui';
import { useSettings } from './providers';

type OD = Omit<Order, 'id'|'subCommittees'|'attachments'|'createdAt'|'updatedAt'|'createdBy'>;

// ── Order Form ─────────────────────────────────────────────────────
export function OrderForm({ initial, onSave, onClose }: {
  initial?: Partial<OD>;
  onSave: (d: OD, file?: File) => Promise<void>;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const isNew = !initial?.orderNumber;
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState<OD>({
    orderNumber: '', orderDate: '', effectiveDate: '', type: settings.orderTypes[0] || 'คณะกรรมการ',
    title: '', background: '', signedBy: '', signedByTitle: 'ผู้ว่าราชการจังหวัดสระบุรี',
    status: 'ACTIVE', cancelReason: null, agencyId: null, ...initial,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/agencies').then(r => r.ok ? r.json() : []).then(setAgencies).catch(() => {});
  }, []);

  const set = (k: keyof OD) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.value || null }));

  async function save() {
    if (!f.orderNumber.trim() || !f.title.trim()) { setErr('กรุณากรอกเลขคำสั่ง และชื่อเรื่อง'); return; }
    if (isNew && !file) { setErr('กรุณาแนบไฟล์คำสั่ง (PDF, Word, Excel)'); return; }
    setBusy(true); setErr('');
    try { await onSave(f, file || undefined); } catch { setErr('เกิดข้อผิดพลาด'); } finally { setBusy(false); }
  }

  return <Modal title={isNew ? 'เพิ่มคำสั่งใหม่' : 'แก้ไขคำสั่ง'} onClose={onClose} wide>
    {err && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{err}</p>}
    <div className="grid grid-cols-2 gap-x-3">
      <FG label="เลขคำสั่ง" required><Input value={f.orderNumber} onChange={set('orderNumber')} placeholder="เช่น 4971/2568" /></FG>
      <FG label="ประเภท" required><Select options={settings.orderTypes} value={f.type} onChange={set('type')} /></FG>
    </div>
    <FG label="ชื่อเรื่อง" required><Input value={f.title} onChange={set('title')} placeholder="เรื่อง แต่งตั้ง ..." /></FG>
    <FG label="หน่วยงานเจ้าของคำสั่ง">
      <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
        value={f.agencyId || ''} onChange={e => setF(p => ({ ...p, agencyId: e.target.value || null }))}>
        <option value="">-- ไม่ระบุ --</option>
        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </FG>
    <FG label="หลักการและเหตุผล"><Textarea rows={3} value={f.background || ''} onChange={set('background')} /></FG>
    <div className="grid grid-cols-2 gap-x-3">
      <FG label="วันที่ออกคำสั่ง"><Input type="date" value={f.orderDate || ''} onChange={set('orderDate')} /></FG>
      <FG label="วันที่มีผลบังคับ"><Input type="date" value={f.effectiveDate || ''} onChange={set('effectiveDate')} /></FG>
      <FG label="ชื่อผู้ลงนาม"><Input value={f.signedBy || ''} onChange={set('signedBy')} placeholder="นาย/นาง ..." /></FG>
      <FG label="ตำแหน่งผู้ลงนาม"><Input value={f.signedByTitle || ''} onChange={set('signedByTitle')} /></FG>
    </div>
    {isNew && (
      <FG label="ไฟล์คำสั่ง" required>
        <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold cursor-pointer" />
        <p className="text-xs text-gray-400 mt-1">รองรับ PDF, Word, Excel (จำเป็น)</p>
      </FG>
    )}
    <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
      <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
      <Btn onClick={save} loading={busy}>💾 บันทึก</Btn>
    </div>
  </Modal>;
}

// ── Status Form ────────────────────────────────────────────────────
export function StatusForm({ current, onSave, onClose }: { current: string; onSave: (s: string, r: string) => Promise<void>; onClose: () => void }) {
  const [status, setStatus] = useState(current);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (status === 'CANCELLED' && !reason.trim()) { alert('กรุณาระบุเหตุผลการยกเลิก'); return; }
    setBusy(true); try { await onSave(status, reason); } finally { setBusy(false); }
  }
  const statuses = [{ v:'ACTIVE',l:'มีผลบังคับ'},{v:'DRAFT',l:'ร่าง'},{v:'CANCELLED',l:'ยกเลิกแล้ว'}];
  return <Modal title="เปลี่ยนสถานะคำสั่ง" onClose={onClose}>
    <FG label="สถานะ"><select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
      value={status} onChange={e => setStatus(e.target.value)}>
      {statuses.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
    </select></FG>
    {status === 'CANCELLED' && <FG label="เหตุผลการยกเลิก" required>
      <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="ระบุเหตุผล ..." /></FG>}
    <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
      <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
      <Btn onClick={save} loading={busy}>💾 บันทึก</Btn>
    </div>
  </Modal>;
}

// ── SubCommittee Form ──────────────────────────────────────────────
type SCD = Omit<SubCommittee,'id'|'orderId'|'members'>;
export function SCForm({ initial, onSave, onClose }: { initial?: Partial<SCD>; onSave: (d: SCD) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<SCD>({ name:'', seq:1, duties:'', ...initial });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SCD) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: k === 'seq' ? parseInt(e.target.value)||1 : e.target.value }));
  async function save() {
    if (!f.name.trim()) { alert('กรุณากรอกชื่อคณะย่อย'); return; }
    setBusy(true); try { await onSave(f); } finally { setBusy(false); }
  }
  return <Modal title={initial?.name ? 'แก้ไขคณะย่อย' : 'เพิ่มคณะย่อย / ฝ่าย'} onClose={onClose}>
    <FG label="ชื่อคณะ / ฝ่าย" required><Input value={f.name} onChange={set('name')} placeholder="เช่น ฝ่ายอำนวยการ" /></FG>
    <FG label="ลำดับที่"><Input type="number" min={1} value={f.seq} onChange={set('seq')} /></FG>
    <FG label="หน้าที่และอำนาจ"><Textarea rows={6} value={f.duties||''} onChange={set('duties')} placeholder="ระบุหน้าที่และอำนาจ ..." /></FG>
    <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
      <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
      <Btn onClick={save} loading={busy}>💾 บันทึก</Btn>
    </div>
  </Modal>;
}

// ── Agency Combobox ────────────────────────────────────────────────
function AgencyCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/agencies').then(r => r.ok ? r.json() : []).then(setAgencies).catch(() => {});
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = query
    ? agencies.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : agencies;

  function select(name: string) {
    setQuery(name); onChange(name); setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        placeholder="พิมพ์เพื่อค้นหาหรือกรอกเอง..."
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(a => (
            <li key={a.id}
              onMouseDown={() => select(a.name)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors">
              🏢 {a.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Member Form ────────────────────────────────────────────────────
type MD = Omit<Member,'id'|'subCommitteeId'>;
export function MemberForm({ initial, onSave, onClose }: { initial?: Partial<MD>; onSave: (d: MD) => Promise<void>; onClose: () => void }) {
  const { settings } = useSettings();
  const [f, setF] = useState<MD>({ name:null, agencyPosition:null, agency:null, role:'กรรมการ', seq:1, ...initial });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof MD) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.value || null }));
  async function save() {
    if (!f.agencyPosition?.trim() && !f.name?.trim()) { alert('กรุณากรอกตำแหน่ง หรือชื่อ'); return; }
    setBusy(true); try { await onSave(f); } finally { setBusy(false); }
  }
  return <Modal title={initial?.agencyPosition ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อ'} onClose={onClose}>
    <FG label="ชื่อ-นามสกุล (กรณีระบุเฉพาะบุคคล)"><Input value={f.name||''} onChange={set('name')} placeholder="กรณีระบุบุคคลเฉพาะ" /></FG>
    <FG label="ตำแหน่งในองค์กร" required><Input value={f.agencyPosition||''} onChange={set('agencyPosition')} placeholder="เช่น ผู้ว่าราชการจังหวัด" /></FG>
    <FG label="หน่วยงาน / สังกัด">
      <AgencyCombobox value={f.agency || ''} onChange={v => setF(p => ({ ...p, agency: v || null }))} />
    </FG>
    <FG label="บทบาทในคณะ" required><Select options={settings.memberRoles} value={f.role||''} onChange={set('role')} /></FG>
    <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
      <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
      <Btn onClick={save} loading={busy}>💾 บันทึก</Btn>
    </div>
  </Modal>;
}

// ── Import Excel Form ──────────────────────────────────────────────
export function ImportForm({ scId, onDone, onClose }: { scId: string; onDone: (count: number) => void; onClose: () => void }) {
  const [file, setFile] = useState<File|null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function doImport() {
    if (!file) { setErr('กรุณาเลือกไฟล์'); return; }
    setBusy(true); setErr('');
    const form = new FormData();
    form.append('file', file);
    form.append('scId', scId);
    const r = await fetch('/api/import', { method: 'POST', body: form });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(d.error || 'เกิดข้อผิดพลาด'); return; }
    onDone(d.imported);
  }

  return <Modal title="นำเข้ารายชื่อจาก Excel" onClose={onClose}>
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <p className="font-semibold mb-1">รูปแบบไฟล์ Excel (.xlsx)</p>
      <p>คอลัมน์ที่รองรับ: <code className="bg-blue-100 px-1 rounded">ชื่อ</code> <code className="bg-blue-100 px-1 rounded">ตำแหน่ง</code> <code className="bg-blue-100 px-1 rounded">หน่วยงาน</code> <code className="bg-blue-100 px-1 rounded">บทบาท</code></p>
      <a href="/api/import" className="text-blue-700 underline font-semibold mt-1 inline-block">⬇ ดาวน์โหลด Template</a>
    </div>
    {err && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{err}</p>}
    <FG label="เลือกไฟล์ .xlsx">
      <input type="file" accept=".xlsx,.xls"
        onChange={e => setFile(e.target.files?.[0] || null)}
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold cursor-pointer" />
    </FG>
    <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
      <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
      <Btn onClick={doImport} loading={busy} disabled={!file}>📥 นำเข้า</Btn>
    </div>
  </Modal>;
}
