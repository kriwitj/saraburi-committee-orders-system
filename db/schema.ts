import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const nowSql = sql`to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')`;

export const agencies = pgTable('agencies', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull().default(nowSql),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  prefix: text('prefix'),
  name: text('name'),
  agencyId: text('agency_id').references(() => agencies.id, { onDelete: 'set null' }),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('VIEWER'), // ADMIN | EDITOR | VIEWER
  createdAt: text('created_at').notNull().default(nowSql),
  updatedAt: text('updated_at').notNull().default(nowSql),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  orderDate: text('order_date'),
  effectiveDate: text('effective_date'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  background: text('background'),
  signedBy: text('signed_by'),
  signedByTitle: text('signed_by_title'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | CANCELLED | DRAFT | DELETED
  cancelReason: text('cancel_reason'),
  agencyId: text('agency_id').references(() => agencies.id, { onDelete: 'set null' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default(nowSql),
  updatedAt: text('updated_at').notNull().default(nowSql),
});

export const subCommittees = pgTable('sub_committees', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  seq: integer('seq').notNull().default(1),
  duties: text('duties'),
  createdAt: text('created_at').notNull().default(nowSql),
});

export const members = pgTable('members', {
  id: text('id').primaryKey(),
  subCommitteeId: text('sub_committee_id').notNull().references(() => subCommittees.id, { onDelete: 'cascade' }),
  name: text('name'),
  agencyPosition: text('agency_position'),
  agency: text('agency'),
  role: text('role'),
  seq: integer('seq').notNull().default(1),
});

export const attachments = pgTable('attachments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  fileType: text('file_type').notNull(),
  blobUrl: text('blob_url').notNull(),
  size: integer('size').notNull().default(0),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default(nowSql),
});
