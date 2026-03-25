import { client, initDb } from './index';
import { genId, nowIso } from '../lib/utils';
import type { Order, SubCommittee, Member, Attachment, Settings } from '../types';
import { DEFAULT_ORDER_TYPES, DEFAULT_MEMBER_ROLES } from '../types';

let initialized = false;
async function ensureInit() {
  if (!initialized) { await initDb(); initialized = true; }
}

// ─── Orders ───────────────────────────────────────────────────────
export async function getOrders(): Promise<Order[]> {
  await ensureInit();
  const rows = await client.execute('SELECT * FROM orders ORDER BY created_at DESC');
  const orders = rows.rows as unknown as RawOrder[];
  const result: Order[] = [];
  for (const o of orders) {
    const scs = await getSubCommittees(o.id);
    const atts = await getAttachments(o.id);
    result.push(mapOrder(o, scs, atts));
  }
  return result;
}

export async function getOrder(id: string): Promise<Order | null> {
  await ensureInit();
  const rows = await client.execute({ sql: 'SELECT * FROM orders WHERE id=?', args: [id] });
  if (!rows.rows.length) return null;
  const o = rows.rows[0] as unknown as RawOrder;
  const scs = await getSubCommittees(id);
  const atts = await getAttachments(id);
  return mapOrder(o, scs, atts);
}

export async function createOrder(data: Partial<Order>, userId?: string): Promise<Order> {
  await ensureInit();
  const id = genId();
  const now = nowIso();
  await client.execute({
    sql: `INSERT INTO orders (id,order_number,order_date,effective_date,type,title,background,signed_by,signed_by_title,status,created_by,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, data.orderNumber||'', data.orderDate||null, data.effectiveDate||null,
           data.type||'คณะกรรมการ', data.title||'', data.background||null,
           data.signedBy||null, data.signedByTitle||null,
           data.status||'ACTIVE', userId||null, now, now],
  });
  return (await getOrder(id))!;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  await ensureInit();
  const now = nowIso();
  const sets: string[] = [];
  const args: import('@libsql/client').InValue[] = [];
  const map: Record<string, string> = {
    orderNumber:'order_number', orderDate:'order_date', effectiveDate:'effective_date',
    type:'type', title:'title', background:'background', signedBy:'signed_by',
    signedByTitle:'signed_by_title', status:'status', cancelReason:'cancel_reason',
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in data) { sets.push(`${col}=?`); args.push(((data as Record<string, unknown>)[k] ?? null) as import('@libsql/client').InValue); }
  }
  if (!sets.length) return getOrder(id);
  sets.push('updated_at=?'); args.push(now);
  args.push(id);
  await client.execute({ sql: `UPDATE orders SET ${sets.join(',')} WHERE id=?`, args });
  return getOrder(id);
}

export async function deleteOrder(id: string): Promise<void> {
  await ensureInit();
  await client.execute({ sql: 'DELETE FROM orders WHERE id=?', args: [id] });
}

// ─── SubCommittees ────────────────────────────────────────────────
export async function getSubCommittees(orderId: string): Promise<SubCommittee[]> {
  const rows = await client.execute({
    sql: 'SELECT * FROM sub_committees WHERE order_id=? ORDER BY seq',
    args: [orderId],
  });
  const scs = rows.rows as unknown as RawSC[];
  const result: SubCommittee[] = [];
  for (const sc of scs) {
    const members = await getMembers(sc.id);
    result.push(mapSC(sc, members));
  }
  return result;
}

export async function createSubCommittee(orderId: string, data: Partial<SubCommittee>): Promise<SubCommittee> {
  await ensureInit();
  const id = genId();
  const now = nowIso();
  await client.execute({
    sql: 'INSERT INTO sub_committees (id,order_id,name,seq,duties,created_at) VALUES (?,?,?,?,?,?)',
    args: [id, orderId, data.name||'', data.seq||1, data.duties||null, now],
  });
  const members = await getMembers(id);
  const rows = await client.execute({ sql: 'SELECT * FROM sub_committees WHERE id=?', args: [id] });
  return mapSC(rows.rows[0] as unknown as RawSC, members);
}

export async function updateSubCommittee(id: string, data: Partial<SubCommittee>): Promise<void> {
  await client.execute({
    sql: 'UPDATE sub_committees SET name=?,seq=?,duties=? WHERE id=?',
    args: [data.name||'', data.seq||1, data.duties||null, id],
  });
}

export async function deleteSubCommittee(id: string): Promise<void> {
  await client.execute({ sql: 'DELETE FROM sub_committees WHERE id=?', args: [id] });
}

// ─── Members ──────────────────────────────────────────────────────
export async function getMembers(scId: string): Promise<Member[]> {
  const rows = await client.execute({
    sql: 'SELECT * FROM members WHERE sub_committee_id=? ORDER BY seq',
    args: [scId],
  });
  return (rows.rows as unknown as RawMember[]).map(mapMember);
}

export async function createMember(scId: string, data: Partial<Member>): Promise<Member> {
  await ensureInit();
  const id = genId();
  await client.execute({
    sql: 'INSERT INTO members (id,sub_committee_id,name,agency_position,agency,role,seq) VALUES (?,?,?,?,?,?,?)',
    args: [id, scId, data.name||null, data.agencyPosition||null, data.agency||null, data.role||null, data.seq||1],
  });
  const rows = await client.execute({ sql: 'SELECT * FROM members WHERE id=?', args: [id] });
  return mapMember(rows.rows[0] as unknown as RawMember);
}

export async function updateMember(id: string, data: Partial<Member>): Promise<void> {
  await client.execute({
    sql: 'UPDATE members SET name=?,agency_position=?,agency=?,role=?,seq=? WHERE id=?',
    args: [data.name||null, data.agencyPosition||null, data.agency||null, data.role||null, data.seq||1, id],
  });
}

export async function deleteMember(id: string): Promise<void> {
  await client.execute({ sql: 'DELETE FROM members WHERE id=?', args: [id] });
}

// ─── Attachments ──────────────────────────────────────────────────
export async function getAttachments(orderId: string): Promise<Attachment[]> {
  const rows = await client.execute({
    sql: 'SELECT * FROM attachments WHERE order_id=? ORDER BY created_at',
    args: [orderId],
  });
  return (rows.rows as unknown as RawAtt[]).map(mapAtt);
}

export async function createAttachment(orderId: string, data: Omit<Attachment,'id'|'orderId'>, userId?: string): Promise<Attachment> {
  await ensureInit();
  const id = genId();
  const now = nowIso();
  await client.execute({
    sql: 'INSERT INTO attachments (id,order_id,filename,original_name,file_type,file_path,size,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    args: [id, orderId, data.filename, data.originalName, data.fileType, (data as unknown as {filePath:string}).filePath, data.size, userId||null, now],
  });
  const rows = await client.execute({ sql: 'SELECT * FROM attachments WHERE id=?', args: [id] });
  return mapAtt(rows.rows[0] as unknown as RawAtt);
}

export async function deleteAttachment(id: string): Promise<string> {
  const rows = await client.execute({ sql: 'SELECT file_path FROM attachments WHERE id=?', args: [id] });
  const path = (rows.rows[0] as unknown as {file_path:string})?.file_path || '';
  await client.execute({ sql: 'DELETE FROM attachments WHERE id=?', args: [id] });
  return path;
}

// ─── Settings ─────────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  await ensureInit();
  const rows = await client.execute("SELECT * FROM settings WHERE key IN ('orderTypes','memberRoles')");
  const map: Record<string, string[]> = {};
  for (const r of rows.rows as unknown as {key:string;value:string}[]) {
    try { map[r.key] = JSON.parse(r.value); } catch {}
  }
  return {
    orderTypes: map.orderTypes || DEFAULT_ORDER_TYPES,
    memberRoles: map.memberRoles || DEFAULT_MEMBER_ROLES,
  };
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  await ensureInit();
  for (const [k, v] of Object.entries(data)) {
    const id = genId();
    await client.execute({
      sql: `INSERT INTO settings (id,key,value) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      args: [id, k, JSON.stringify(v)],
    });
  }
  return getSettings();
}

// ─── Users ────────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  await ensureInit();
  const rows = await client.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email] });
  return rows.rows[0] as unknown as RawUser | undefined;
}

export async function getUsers() {
  await ensureInit();
  const rows = await client.execute('SELECT id,email,name,role,created_at FROM users ORDER BY created_at');
  return rows.rows as unknown as Pick<RawUser,'id'|'email'|'name'|'role'|'created_at'>[];
}

export async function createUser(email: string, name: string, passwordHash: string, role: string) {
  await ensureInit();
  const id = genId();
  const now = nowIso();
  await client.execute({
    sql: 'INSERT INTO users (id,email,name,password_hash,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
    args: [id, email, name, passwordHash, role, now, now],
  });
  return id;
}

export async function updateUser(id: string, data: {name?:string;role?:string;passwordHash?:string}) {
  await ensureInit();
  const sets: string[] = [];
  const args: import('@libsql/client').InValue[] = [];
  if (data.name !== undefined) { sets.push('name=?'); args.push(data.name); }
  if (data.role) { sets.push('role=?'); args.push(data.role); }
  if (data.passwordHash) { sets.push('password_hash=?'); args.push(data.passwordHash); }
  if (!sets.length) return;
  args.push(nowIso()); args.push(id);
  await client.execute({ sql: `UPDATE users SET ${sets.join(',')},updated_at=? WHERE id=?`, args });
}

export async function deleteUser(id: string) {
  await ensureInit();
  await client.execute({ sql: 'DELETE FROM users WHERE id=?', args: [id] });
}

// ─── Seed (first run) ─────────────────────────────────────────────
export async function seedIfEmpty(adminHash: string) {
  await ensureInit();
  const rows = await client.execute('SELECT COUNT(*) as cnt FROM users');
  if ((rows.rows[0] as unknown as {cnt:number}).cnt > 0) return;
  await client.execute({
    sql: 'INSERT INTO users (id,email,name,password_hash,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
    args: [genId(),'admin@sarorders.local','ผู้ดูแลระบบ',adminHash,'ADMIN',nowIso(),nowIso()],
  });
}

// ─── Raw types ────────────────────────────────────────────────────
interface RawOrder { id:string; order_number:string; order_date:string|null; effective_date:string|null;
  type:string; title:string; background:string|null; signed_by:string|null; signed_by_title:string|null;
  status:string; cancel_reason:string|null; created_by:string|null; created_at:string; updated_at:string; }
interface RawSC { id:string; order_id:string; name:string; seq:number; duties:string|null; created_at:string; }
interface RawMember { id:string; sub_committee_id:string; name:string|null; agency_position:string|null;
  agency:string|null; role:string|null; seq:number; }
interface RawAtt { id:string; order_id:string; filename:string; original_name:string;
  file_type:string; file_path:string; size:number; uploaded_by:string|null; created_at:string; }
interface RawUser { id:string; email:string; name:string|null; password_hash:string; role:string;
  created_at:string; updated_at:string; }

function mapOrder(o: RawOrder, scs: SubCommittee[], atts: Attachment[]): Order {
  return { id:o.id, orderNumber:o.order_number, orderDate:o.order_date, effectiveDate:o.effective_date,
    type:o.type, title:o.title, background:o.background, signedBy:o.signed_by, signedByTitle:o.signed_by_title,
    status:o.status as Order['status'], cancelReason:o.cancel_reason, createdBy:o.created_by,
    createdAt:o.created_at, updatedAt:o.updated_at, subCommittees:scs, attachments:atts };
}
function mapSC(sc: RawSC, members: Member[]): SubCommittee {
  return { id:sc.id, orderId:sc.order_id, name:sc.name, seq:sc.seq, duties:sc.duties,
    createdAt:sc.created_at, members } as SubCommittee & {createdAt:string};
}
function mapMember(m: RawMember): Member {
  return { id:m.id, subCommitteeId:m.sub_committee_id, name:m.name, agencyPosition:m.agency_position,
    agency:m.agency, role:m.role, seq:m.seq };
}
function mapAtt(a: RawAtt): Attachment {
  return { id:a.id, orderId:a.order_id, filename:a.filename, originalName:a.original_name,
    fileType:a.file_type, size:a.size, createdAt:a.created_at, filePath: a.file_path } as Attachment & {filePath:string};
}
