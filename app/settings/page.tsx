'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, useSettings } from '@/components/providers';
import { AdminLayout } from '@/components/AdminLayout';
import { Btn, Modal, ConfirmModal, Toast, Input, FG } from '@/components/ui';
import type { Agency } from '@/types';

type Tab = 'types' | 'roles' | 'agencies';

// ── ตาราง CRUD สำหรับ string list (ประเภทคำสั่ง / บทบาท) ─────────
function StringList({
  items,
  onSave,
  busy,
  label,
  placeholder,
}: {
  items: string[];
  onSave: (next: string[]) => Promise<void>;
  busy: boolean;
  label: string;
  placeholder: string;
}) {
  const [list, setList] = useState(items);
  const [addVal, setAddVal] = useState('');
  const [dirty, setDirty] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  useEffect(() => { setList(items); setDirty(false); }, [items]);

  function add() {
    const v = addVal.trim();
    if (!v || list.includes(v)) return;
    setList(p => [...p, v]);
    setAddVal('');
    setDirty(true);
  }

  function confirmEdit() {
    if (editIdx === null) return;
    const v = editVal.trim();
    if (v && v !== list[editIdx]) {
      setList(p => { const n = [...p]; n[editIdx] = v; return n; });
      setDirty(true);
    }
    setEditIdx(null);
  }

  function confirmDelete() {
    if (deleteIdx === null) return;
    setList(p => p.filter((_, j) => j !== deleteIdx));
    setDeleteIdx(null);
    setDirty(true);
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          value={addVal}
          onChange={e => setAddVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') add(); }}
        />
        <Btn size="sm" variant="secondary" onClick={add}>+ เพิ่ม</Btn>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีรายการ</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-10">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">{label}</th>
                <th className="px-4 py-2.5 w-32 text-right font-semibold text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 text-gray-800">{item}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Btn size="sm" variant="ghost"
                        onClick={() => { setEditIdx(i); setEditVal(item); }}
                        className="text-blue-600 hover:bg-blue-50">
                        ✏️ แก้ไข
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => setDeleteIdx(i)}>
                        🗑 ลบ
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dirty && (
        <div className="mt-4 flex justify-end">
          <Btn onClick={() => onSave(list)} loading={busy}>💾 บันทึกการเปลี่ยนแปลง</Btn>
        </div>
      )}

      {/* Edit modal */}
      {editIdx !== null && (
        <Modal title={`แก้ไข${label}`} onClose={() => setEditIdx(null)}>
          <FG label={label} required>
            <Input
              autoFocus
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') confirmEdit(); }}
            />
          </FG>
          <div className="flex gap-2 justify-end mt-4">
            <Btn variant="secondary" onClick={() => setEditIdx(null)}>ยกเลิก</Btn>
            <Btn onClick={confirmEdit}>บันทึก</Btn>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteIdx !== null && (
        <ConfirmModal
          text={`ต้องการลบ "${list[deleteIdx]}" ออกจากรายการ?\nการเปลี่ยนแปลงจะมีผลเมื่อกด "บันทึก"`}
          onConfirm={confirmDelete}
          onClose={() => setDeleteIdx(null)}
        />
      )}
    </div>
  );
}

// ── ตาราง CRUD สำหรับหน่วยงาน ──────────────────────────────────────
function AgencyList({ notify }: { notify: (m: string, t?: 'ok' | 'err') => void }) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editTarget, setEditTarget] = useState<Agency | null>(null);
  const [editVal, setEditVal] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/agencies');
    if (r.ok) setAgencies(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const r = await fetch('/api/agencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) { setNewName(''); load(); notify('เพิ่มหน่วยงานแล้ว'); }
    else notify(d.error || 'เกิดข้อผิดพลาด', 'err');
  }

  async function saveEdit() {
    if (!editTarget) return;
    const name = editVal.trim();
    if (!name) { setEditTarget(null); return; }
    setBusy(true);
    const r = await fetch(`/api/agencies/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    setEditTarget(null);
    if (r.ok) { load(); notify('แก้ไขหน่วยงานแล้ว'); }
    else notify('แก้ไขไม่สำเร็จ', 'err');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDelBusy(true);
    const r = await fetch('/api/agencies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    setDelBusy(false);
    setDeleteTarget(null);
    if (r.ok) { load(); notify('ลบหน่วยงานแล้ว'); }
    else notify('ลบไม่สำเร็จ', 'err');
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="ชื่อหน่วยงานใหม่..."
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') add(); }}
        />
        <Btn size="sm" variant="secondary" onClick={add} loading={busy}>+ เพิ่ม</Btn>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {agencies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีหน่วยงาน</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-10">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">ชื่อหน่วยงาน</th>
                <th className="px-4 py-2.5 w-32 text-right font-semibold text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a, i) => (
                <tr key={a.id} className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 text-gray-800">{a.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Btn size="sm" variant="ghost"
                        onClick={() => { setEditTarget(a); setEditVal(a.name); }}
                        className="text-blue-600 hover:bg-blue-50">
                        ✏️ แก้ไข
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>
                        🗑 ลบ
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal title="แก้ไขหน่วยงาน" onClose={() => setEditTarget(null)}>
          <FG label="ชื่อหน่วยงาน" required>
            <Input
              autoFocus
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') saveEdit(); }}
            />
          </FG>
          <div className="flex gap-2 justify-end mt-4">
            <Btn variant="secondary" onClick={() => setEditTarget(null)}>ยกเลิก</Btn>
            <Btn onClick={saveEdit} loading={busy}>บันทึก</Btn>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          text={`ต้องการลบหน่วยงาน "${deleteTarget.name}" ?\nหน่วยงานที่ลบแล้วอาจส่งผลต่อคำสั่งที่ผูกไว้`}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
          loading={delBusy}
        />
      )}
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
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <AdminLayout title="ตั้งค่าระบบ">
        <div className="max-w-lg mx-auto p-8 text-center text-gray-500 mt-10">
          <div className="text-4xl mb-3">🔒</div>
          <p>ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </AdminLayout>
    );
  }

  async function saveSettings(key: 'orderTypes' | 'memberRoles', values: string[]) {
    setBusy(true);
    const r = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: values }),
    });
    setBusy(false);
    if (r.ok) { await reload(); notify('บันทึกแล้ว'); }
    else notify('เกิดข้อผิดพลาด', 'err');
  }

  const tabs: { id: Tab; label: string; count: number | null }[] = [
    { id: 'types',    label: '📋 ประเภทคำสั่ง', count: settings.orderTypes.length },
    { id: 'roles',    label: '👤 บทบาท',        count: settings.memberRoles.length },
    { id: 'agencies', label: '🏢 หน่วยงาน',     count: null },
  ];

  const tabMeta: Record<Tab, { title: string; sub: string }> = {
    types:    { title: 'ประเภทของคำสั่ง',  sub: 'ใช้เป็นตัวเลือกเมื่อสร้างคำสั่งใหม่' },
    roles:    { title: 'บทบาทในคณะ',       sub: 'ใช้เป็นตัวเลือกบทบาทของสมาชิกในแต่ละคณะ' },
    agencies: { title: 'หน่วยงานในระบบ',   sub: 'หน่วยงานที่ใช้อ้างอิงสำหรับผู้ใช้และคำสั่ง' },
  };

  return (
    <AdminLayout title="ตั้งค่าระบบ">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">⚙️ ตั้งค่าข้อมูลตั้งต้น</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการประเภทคำสั่ง บทบาท และหน่วยงานที่ใช้ในระบบ</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5
                ${activeTab === t.id ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.label}
              {t.count !== null && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-normal
                  ${activeTab === t.id ? 'bg-blue-600 text-blue-100' : 'bg-gray-200 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{tabMeta[activeTab].title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tabMeta[activeTab].sub}</p>
          </div>
          <div className="p-6">
            {activeTab === 'types' && (
              <StringList
                items={settings.orderTypes}
                onSave={v => saveSettings('orderTypes', v)}
                busy={busy}
                label="ประเภทคำสั่ง"
                placeholder="เพิ่มประเภทใหม่..."
              />
            )}
            {activeTab === 'roles' && (
              <StringList
                items={settings.memberRoles}
                onSave={v => saveSettings('memberRoles', v)}
                busy={busy}
                label="บทบาท"
                placeholder="เพิ่มบทบาทใหม่..."
              />
            )}
            {activeTab === 'agencies' && (
              <AgencyList notify={notify} />
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
