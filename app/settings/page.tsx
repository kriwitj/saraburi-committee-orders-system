'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, useSettings } from '@/components/providers';
import { AdminLayout } from '@/components/AdminLayout';
import { Btn, Toast, Input } from '@/components/ui';
import type { Agency } from '@/types';

type Tab = 'types' | 'roles' | 'agencies';

// ── Inline-editable string list (types / roles) ────────────────────
function StringList({
  items, onSave, busy, placeholder,
}: {
  items: string[]; onSave: (next: string[]) => Promise<void>; busy: boolean; placeholder: string;
}) {
  const [list, setList] = useState(items);
  const [newVal, setNewVal] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setList(items); setDirty(false); }, [items]);

  function add() {
    const v = newVal.trim();
    if (!v || list.includes(v)) return;
    setList(p => [...p, v]); setNewVal(''); setDirty(true);
  }
  function remove(i: number) { setList(p => p.filter((_, j) => j !== i)); setDirty(true); }
  function startEdit(i: number) { setEditIdx(i); setEditVal(list[i]); }
  function saveEdit() {
    if (editIdx === null) return;
    const v = editVal.trim();
    if (!v) { setEditIdx(null); return; }
    setList(p => { const n = [...p]; n[editIdx] = v; return n; });
    setEditIdx(null); setDirty(true);
  }

  return (
    <div>
      <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
        {list.length === 0 && <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีรายการ</p>}
        {list.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 group hover:bg-gray-100 transition-colors">
            {editIdx === i ? (
              <>
                <input value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }}
                  autoFocus
                  className="flex-1 border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer px-1 text-sm">✓</button>
                <button onClick={() => setEditIdx(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer px-1 text-sm">✕</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{item}</span>
                <button onClick={() => startEdit(i)}
                  className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 text-xs cursor-pointer transition-opacity px-1">✏️</button>
                <button onClick={() => remove(i)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 cursor-pointer transition-opacity px-1 text-sm">✕</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={placeholder}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') add(); }} />
        <Btn size="sm" variant="secondary" onClick={add}>+ เพิ่ม</Btn>
      </div>
      {dirty && <Btn onClick={() => onSave(list)} loading={busy}>💾 บันทึกการเปลี่ยนแปลง</Btn>}
    </div>
  );
}

// ── Agencies with full CRUD ────────────────────────────────────────
function AgencyList({ notify }: { notify: (m: string, t?: 'ok'|'err') => void }) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/agencies');
    if (r.ok) setAgencies(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    const name = newName.trim(); if (!name) return;
    setBusy(true);
    const r = await fetch('/api/agencies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const d = await r.json(); setBusy(false);
    if (r.ok) { setNewName(''); load(); notify('เพิ่มหน่วยงานแล้ว'); }
    else notify(d.error || 'เกิดข้อผิดพลาด', 'err');
  }

  async function saveEdit(id: string) {
    const name = editVal.trim(); if (!name) { setEditId(null); return; }
    setBusy(true);
    const r = await fetch(`/api/agencies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setBusy(false); setEditId(null);
    if (r.ok) { load(); notify('แก้ไขแล้ว'); } else notify('แก้ไขไม่สำเร็จ', 'err');
  }

  async function del(id: string) {
    if (!confirm('ต้องการลบหน่วยงานนี้?')) return;
    const r = await fetch('/api/agencies', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (r.ok) { load(); notify('ลบแล้ว'); } else notify('ลบไม่สำเร็จ', 'err');
  }

  return (
    <div>
      <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
        {agencies.length === 0 && <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีหน่วยงาน</p>}
        {agencies.map(a => (
          <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 group hover:bg-gray-100 transition-colors">
            {editId === a.id ? (
              <>
                <input value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(a.id); if (e.key === 'Escape') setEditId(null); }}
                  autoFocus
                  className="flex-1 border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={() => saveEdit(a.id)} className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer px-1 text-sm">✓</button>
                <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer px-1 text-sm">✕</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{a.name}</span>
                <button onClick={() => { setEditId(a.id); setEditVal(a.name); }}
                  className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 text-xs cursor-pointer transition-opacity px-1">✏️</button>
                <button onClick={() => del(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 cursor-pointer transition-opacity px-1 text-sm">🗑</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ชื่อหน่วยงานใหม่... (Enter)"
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') add(); }} />
        <Btn size="sm" variant="secondary" onClick={add} loading={busy}>+ เพิ่ม</Btn>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, reload } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('types');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [busy, setBusy] = useState(false);

  const notify = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <AdminLayout title="ตั้งค่าระบบ">
        <div className="max-w-lg mx-auto p-8 text-center text-gray-500 mt-10">
          <div className="text-4xl mb-3">🔒</div><p>ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </AdminLayout>
    );
  }

  async function saveSettings(key: 'orderTypes' | 'memberRoles', values: string[]) {
    setBusy(true);
    const r = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: values }) });
    setBusy(false);
    if (r.ok) { await reload(); notify('บันทึกแล้ว'); } else notify('เกิดข้อผิดพลาด', 'err');
  }

  const tabs: [Tab, string][] = [['types', '📋 ประเภทคำสั่ง'], ['roles', '👤 บทบาท'], ['agencies', '🏢 หน่วยงาน']];

  return (
    <AdminLayout title="ตั้งค่าระบบ">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">⚙️ ตั้งค่าข้อมูลตั้งต้น</h1>
        </div>

        <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm w-fit flex-wrap">
          {tabs.map(([t, l]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors
                ${activeTab === t ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          {activeTab === 'types' && (
            <>
              <h2 className="font-bold text-gray-900 mb-1">ประเภทของคำสั่ง</h2>
              <p className="text-xs text-gray-400 mb-4">hover รายการเพื่อแก้ไขหรือลบ</p>
              <StringList items={settings.orderTypes} onSave={v => saveSettings('orderTypes', v)} busy={busy} placeholder="เพิ่มประเภทใหม่... (Enter)" />
            </>
          )}
          {activeTab === 'roles' && (
            <>
              <h2 className="font-bold text-gray-900 mb-1">บทบาทในคณะ</h2>
              <p className="text-xs text-gray-400 mb-4">hover รายการเพื่อแก้ไขหรือลบ</p>
              <StringList items={settings.memberRoles} onSave={v => saveSettings('memberRoles', v)} busy={busy} placeholder="เพิ่มบทบาทใหม่... (Enter)" />
            </>
          )}
          {activeTab === 'agencies' && (
            <>
              <h2 className="font-bold text-gray-900 mb-1">หน่วยงานในระบบ</h2>
              <p className="text-xs text-gray-400 mb-4">hover รายการเพื่อแก้ไขหรือลบ</p>
              <AgencyList notify={notify} />
            </>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
