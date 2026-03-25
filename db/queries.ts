import { db } from './index';
import { orders, subCommittees, members, attachments, users, settings, agencies } from './schema';
import { eq, desc, asc, ne, sql } from 'drizzle-orm';
import { genId, nowIso } from '../lib/utils';
import type { Order, SubCommittee, Member, Attachment, Settings, Agency, UserRole } from '../types';
import { DEFAULT_ORDER_TYPES, DEFAULT_MEMBER_ROLES } from '../types';

// ─── Agencies ─────────────────────────────────────────────────────
export async function getAgencies(): Promise<Agency[]> {
  const rows = await db.select().from(agencies).orderBy(asc(agencies.name));
  return rows.map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt }));
}

export async function createAgency(name: string): Promise<Agency> {
  const id = genId();
  const now = nowIso();
  await db.insert(agencies).values({ id, name, createdAt: now });
  const [row] = await db.select().from(agencies).where(eq(agencies.id, id));
  return { id: row.id, name: row.name, createdAt: row.createdAt };
}

export async function deleteAgency(id: string): Promise<void> {
  await db.delete(agencies).where(eq(agencies.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────
export async function getOrders(userRole?: UserRole): Promise<Order[]> {
  const rows = userRole === 'ADMIN'
    ? await db.select().from(orders).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).where(ne(orders.status, 'DELETED')).orderBy(desc(orders.createdAt));

  const result: Order[] = [];
  for (const o of rows) {
    const scs = await getSubCommittees(o.id);
    const atts = await getAttachments(o.id);
    result.push(mapOrder(o, scs, atts));
  }
  return result;
}

export async function getOrder(id: string): Promise<Order | null> {
  const [o] = await db.select().from(orders).where(eq(orders.id, id));
  if (!o) return null;
  const scs = await getSubCommittees(id);
  const atts = await getAttachments(id);
  return mapOrder(o, scs, atts);
}

export async function createOrder(data: Partial<Order>, userId?: string): Promise<Order> {
  const id = genId();
  const now = nowIso();
  await db.insert(orders).values({
    id,
    orderNumber: data.orderNumber || '',
    orderDate: data.orderDate || null,
    effectiveDate: data.effectiveDate || null,
    type: data.type || 'คณะกรรมการ',
    title: data.title || '',
    background: data.background || null,
    signedBy: data.signedBy || null,
    signedByTitle: data.signedByTitle || null,
    status: data.status || 'ACTIVE',
    cancelReason: data.cancelReason || null,
    agencyId: data.agencyId || null,
    createdBy: userId || null,
    createdAt: now,
    updatedAt: now,
  });
  return (await getOrder(id))!;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const now = nowIso();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { updatedAt: now };
  const fieldMap: Record<string, keyof typeof orders.$inferInsert> = {
    orderNumber: 'orderNumber', orderDate: 'orderDate', effectiveDate: 'effectiveDate',
    type: 'type', title: 'title', background: 'background', signedBy: 'signedBy',
    signedByTitle: 'signedByTitle', status: 'status', cancelReason: 'cancelReason',
    agencyId: 'agencyId',
  };
  let hasChanges = false;
  for (const [k, col] of Object.entries(fieldMap)) {
    if (k in data) {
      updateData[col] = (data as Record<string, unknown>)[k] ?? null;
      hasChanges = true;
    }
  }
  if (!hasChanges) return getOrder(id);
  await db.update(orders).set(updateData).where(eq(orders.id, id));
  return getOrder(id);
}

export async function deleteOrder(id: string): Promise<void> {
  // Soft delete: mark as DELETED (hard delete only via admin DB tools)
  await db.update(orders).set({ status: 'DELETED', updatedAt: nowIso() }).where(eq(orders.id, id));
}

// ─── SubCommittees ────────────────────────────────────────────────
export async function getSubCommittees(orderId: string): Promise<SubCommittee[]> {
  const rows = await db.select().from(subCommittees)
    .where(eq(subCommittees.orderId, orderId))
    .orderBy(asc(subCommittees.seq));
  const result: SubCommittee[] = [];
  for (const sc of rows) {
    const mems = await getMembers(sc.id);
    result.push({ id: sc.id, orderId: sc.orderId, name: sc.name, seq: sc.seq, duties: sc.duties, members: mems });
  }
  return result;
}

export async function createSubCommittee(orderId: string, data: Partial<SubCommittee>): Promise<SubCommittee> {
  const id = genId();
  const now = nowIso();
  await db.insert(subCommittees).values({
    id, orderId, name: data.name || '', seq: data.seq || 1, duties: data.duties || null, createdAt: now,
  });
  const [sc] = await db.select().from(subCommittees).where(eq(subCommittees.id, id));
  const mems = await getMembers(id);
  return { id: sc.id, orderId: sc.orderId, name: sc.name, seq: sc.seq, duties: sc.duties, members: mems };
}

export async function updateSubCommittee(id: string, data: Partial<SubCommittee>): Promise<void> {
  await db.update(subCommittees).set({
    name: data.name || '', seq: data.seq || 1, duties: data.duties || null,
  }).where(eq(subCommittees.id, id));
}

export async function deleteSubCommittee(id: string): Promise<void> {
  await db.delete(subCommittees).where(eq(subCommittees.id, id));
}

// ─── Members ──────────────────────────────────────────────────────
export async function getMembers(scId: string): Promise<Member[]> {
  const rows = await db.select().from(members)
    .where(eq(members.subCommitteeId, scId))
    .orderBy(asc(members.seq));
  return rows.map(m => ({
    id: m.id, subCommitteeId: m.subCommitteeId, name: m.name,
    agencyPosition: m.agencyPosition, agency: m.agency, role: m.role, seq: m.seq,
  }));
}

export async function createMember(scId: string, data: Partial<Member>): Promise<Member> {
  const id = genId();
  await db.insert(members).values({
    id, subCommitteeId: scId, name: data.name || null, agencyPosition: data.agencyPosition || null,
    agency: data.agency || null, role: data.role || null, seq: data.seq || 1,
  });
  const [m] = await db.select().from(members).where(eq(members.id, id));
  return {
    id: m.id, subCommitteeId: m.subCommitteeId, name: m.name,
    agencyPosition: m.agencyPosition, agency: m.agency, role: m.role, seq: m.seq,
  };
}

export async function updateMember(id: string, data: Partial<Member>): Promise<void> {
  await db.update(members).set({
    name: data.name || null, agencyPosition: data.agencyPosition || null,
    agency: data.agency || null, role: data.role || null, seq: data.seq || 1,
  }).where(eq(members.id, id));
}

export async function deleteMember(id: string): Promise<void> {
  await db.delete(members).where(eq(members.id, id));
}

// ─── Attachments ──────────────────────────────────────────────────
export async function getAttachments(orderId: string): Promise<Attachment[]> {
  const rows = await db.select().from(attachments)
    .where(eq(attachments.orderId, orderId))
    .orderBy(asc(attachments.createdAt));
  return rows.map(a => ({
    id: a.id, orderId: a.orderId, filename: a.filename, originalName: a.originalName,
    fileType: a.fileType, blobUrl: a.blobUrl, size: a.size, createdAt: a.createdAt,
  }));
}

export async function createAttachment(
  orderId: string,
  data: { filename: string; originalName: string; fileType: string; blobUrl: string; size: number },
  userId?: string,
): Promise<Attachment> {
  const id = genId();
  const now = nowIso();
  await db.insert(attachments).values({
    id, orderId, filename: data.filename, originalName: data.originalName,
    fileType: data.fileType, blobUrl: data.blobUrl, size: data.size,
    uploadedBy: userId || null, createdAt: now,
  });
  const [a] = await db.select().from(attachments).where(eq(attachments.id, id));
  return {
    id: a.id, orderId: a.orderId, filename: a.filename, originalName: a.originalName,
    fileType: a.fileType, blobUrl: a.blobUrl, size: a.size, createdAt: a.createdAt,
  };
}

export async function deleteAttachment(id: string): Promise<string> {
  const [a] = await db.select({ blobUrl: attachments.blobUrl }).from(attachments).where(eq(attachments.id, id));
  const blobUrl = a?.blobUrl || '';
  await db.delete(attachments).where(eq(attachments.id, id));
  return blobUrl;
}

// ─── Settings ─────────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings).where(
    sql`${settings.key} IN ('orderTypes', 'memberRoles')`
  );
  const map: Record<string, string[]> = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value); } catch { /* ignore */ }
  }
  return {
    orderTypes: map.orderTypes || DEFAULT_ORDER_TYPES,
    memberRoles: map.memberRoles || DEFAULT_MEMBER_ROLES,
  };
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  for (const [k, v] of Object.entries(data)) {
    const id = genId();
    await db.insert(settings)
      .values({ id, key: k, value: JSON.stringify(v) })
      .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(v) } });
  }
  return getSettings();
}

// ─── Users ────────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  return row;
}

export async function getUsers() {
  return db.select({
    id: users.id, email: users.email, prefix: users.prefix, name: users.name,
    agencyId: users.agencyId, role: users.role, createdAt: users.createdAt,
  }).from(users).orderBy(asc(users.createdAt));
}

export async function createUser(
  email: string, name: string, passwordHash: string, role: string,
  prefix?: string | null, agencyId?: string | null,
) {
  const id = genId();
  const now = nowIso();
  await db.insert(users).values({
    id, email, prefix: prefix || null, name, agencyId: agencyId || null,
    passwordHash, role, createdAt: now, updatedAt: now,
  });
  return id;
}

export async function updateUser(id: string, data: {
  name?: string; role?: string; passwordHash?: string; prefix?: string | null; agencyId?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { updatedAt: nowIso() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role) updateData.role = data.role;
  if (data.passwordHash) updateData.passwordHash = data.passwordHash;
  if ('prefix' in data) updateData.prefix = data.prefix ?? null;
  if ('agencyId' in data) updateData.agencyId = data.agencyId ?? null;
  await db.update(users).set(updateData).where(eq(users.id, id));
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

// ─── Seed (first run) ─────────────────────────────────────────────
export async function seedIfEmpty(adminHash: string) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(count) > 0) return;
  const now = nowIso();
  await db.insert(users).values({
    id: genId(), email: 'admin@sarorders.local', name: 'ผู้ดูแลระบบ',
    passwordHash: adminHash, role: 'ADMIN', createdAt: now, updatedAt: now,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────
type OrderRow = typeof orders.$inferSelect;

function mapOrder(o: OrderRow, scs: SubCommittee[], atts: Attachment[]): Order {
  return {
    id: o.id, orderNumber: o.orderNumber, orderDate: o.orderDate, effectiveDate: o.effectiveDate,
    type: o.type, title: o.title, background: o.background, signedBy: o.signedBy,
    signedByTitle: o.signedByTitle, status: o.status as Order['status'],
    cancelReason: o.cancelReason, agencyId: o.agencyId, createdBy: o.createdBy,
    createdAt: o.createdAt, updatedAt: o.updatedAt, subCommittees: scs, attachments: atts,
  };
}
