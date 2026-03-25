import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'EDITOR', 'VIEWER'] }).notNull().default('VIEWER'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  orderDate: text('order_date'),
  effectiveDate: text('effective_date'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  background: text('background'),
  signedBy: text('signed_by'),
  signedByTitle: text('signed_by_title'),
  status: text('status', { enum: ['ACTIVE', 'CANCELLED', 'DRAFT'] }).notNull().default('ACTIVE'),
  cancelReason: text('cancel_reason'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const subCommittees = sqliteTable('sub_committees', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  name: text('name').notNull(),
  seq: integer('seq').notNull().default(1),
  duties: text('duties'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  subCommitteeId: text('sub_committee_id').notNull(),
  name: text('name'),
  agencyPosition: text('agency_position'),
  agency: text('agency'),
  role: text('role'),
  seq: integer('seq').notNull().default(1),
});

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  fileType: text('file_type').notNull(),
  filePath: text('file_path').notNull(),
  size: integer('size').notNull().default(0),
  uploadedBy: text('uploaded_by'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
