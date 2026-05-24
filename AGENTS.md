<!-- BEGIN:nextjs-agent-rules -->
# ⚠️ This is NOT the Next.js you know

This project uses **Next.js 16.2.1** with **React 19** — both have significant breaking changes from earlier versions. APIs, conventions, and file structure may differ from your training data.

**Before writing any code:** Read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices carefully.
<!-- END:nextjs-agent-rules -->

---

# 🤖 Agent Guide — SAROrders

คู่มือสำหรับ AI agents ที่ทำงานกับโปรเจกต์ระบบคำสั่งจังหวัดสระบุรี

---

## 📌 Project Overview

- **ชื่อโปรเจกต์:** ระบบคำสั่งจังหวัดสระบุรี (SAROrders)
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL via Neon Serverless + Drizzle ORM
- **Storage:** Vercel Blob
- **Auth:** JWT (`jose`) + Cookie-based session

---

## 🏗️ สถาปัตยกรรมและ Conventions

### App Router Structure
- ใช้ **App Router** เท่านั้น — ไม่มี `pages/` directory
- API Routes อยู่ใน `app/api/*/route.ts`
- Layout หลักอยู่ใน `app/layout.tsx`
- Pages ที่ต้อง auth ใช้ `AdminLayout` component

### Database Layer
- **Schema:** [`db/schema.ts`](./db/schema.ts) — Drizzle table definitions
- **Queries:** [`db/queries.ts`](./db/queries.ts) — Database query functions
- **Connection:** [`db/index.ts`](./db/index.ts) — Neon connection pool
- ใช้ Drizzle ORM เสมอ — ห้าม raw SQL โดยตรง ยกเว้นจำเป็นจริงๆ

### Authentication
- JWT token เก็บใน HTTP-only cookie ชื่อ `sarorders_token`
- Helper functions อยู่ใน [`lib/auth.ts`](./lib/auth.ts)
- ใช้ `getAuthUser(req)` เพื่อตรวจสอบ auth ใน API Routes

### File Storage
- ใช้ **Vercel Blob** เท่านั้น — ไม่เก็บไฟล์ใน local filesystem (production)
- Helper functions อยู่ใน [`lib/storage.ts`](./lib/storage.ts)

---

## 📋 Roles & Permissions

```
ADMIN  → ทำได้ทุกอย่าง รวมจัดการ users และ settings
EDITOR → สร้าง/แก้ไข/ลบ orders ได้
VIEWER → ดูได้อย่างเดียว
(public) → เห็นเฉพาะ /api/public/orders
```

ตรวจสอบ role ใน API route ก่อนทุกการแก้ไข:
```typescript
const user = await getAuthUser(req);
if (!user || user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🗃️ Data Models (Summary)

```
agencies    → หน่วยงาน (id, name)
users       → ผู้ใช้ (id, email, role: ADMIN|EDITOR|VIEWER, agencyId)
orders      → คำสั่ง (id, orderNumber, type, title, status: ACTIVE|CANCELLED|DRAFT|DELETED)
subCommittees → คณะย่อย (id, orderId, name, seq, duties)
members     → สมาชิก (id, subCommitteeId, name, role, seq)
attachments → ไฟล์แนบ (id, orderId, filename, blobUrl, fileType: PDF|WORD|EXCEL)
```

ดู schema ละเอียดที่ [`db/schema.ts`](./db/schema.ts)

---

## 🧩 Component Patterns

- **`AdminLayout`** — Wrap ทุก page ที่ต้อง login
- **`ListView`** — แสดงรายการ orders พร้อม pagination
- **`DetailView`** — แสดงรายละเอียด order เดียว
- **`AttachmentsPanel`** — จัดการไฟล์แนบ
- **`forms.tsx`** — Form components สำหรับ order, member, etc.
- **`ui.tsx`** — Reusable UI primitives (Button, Modal, Badge, etc.)

---

## ⚠️ Next.js 16 Breaking Changes ที่ต้องระวัง

1. **`cookies()` และ `headers()`** — เป็น async แล้ว ต้อง `await cookies()`
2. **Route Handlers** — ใช้ `NextRequest` และ `NextResponse` จาก `next/server`
3. **`use client` / `use server`** — ต้องระบุให้ชัดเจน
4. **Metadata API** — ใช้ `export const metadata` แทน `<Head>`
5. **Image component** — props อาจเปลี่ยน ตรวจสอบ docs ก่อน
6. **React 19** — มี breaking changes ด้าน hooks และ concurrent features

> อ่าน docs จริงใน `node_modules/next/dist/docs/` ก่อนเสมอ

---

## 🛠️ Development Commands

```bash
npm run dev          # รัน dev server (port 3000)
npm run build        # Build production
npm run db:push      # Sync schema กับ database
npm run db:studio    # Drizzle Studio UI
npm run lint         # ESLint check
```

---

## 🌐 Environment Variables ที่จำเป็น

```env
DATABASE_URL=postgresql://...          # Neon PostgreSQL
JWT_SECRET=...                         # Secret สำหรับ JWT
BLOB_READ_WRITE_TOKEN=vercel_blob_...  # Vercel Blob
NEXTAUTH_URL=http://localhost:3000     # App URL
```

---

## ✅ Coding Checklist สำหรับ Agents

- [ ] อ่าน Next.js 16 docs ใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด
- [ ] ตรวจสอบ role/permission ก่อนทุก mutation
- [ ] ใช้ Drizzle ORM ผ่าน `db/queries.ts` ไม่ใช่ raw SQL
- [ ] ใช้ TypeScript types จาก `types/index.ts`
- [ ] Await `cookies()` และ `headers()` เสมอ (Next.js 16)
- [ ] ใช้ `lib/utils.ts` สำหรับ date formatting (Thai Buddhist Era)
- [ ] ไฟล์แนบต้องผ่าน Vercel Blob ไม่ใช่ local storage
- [ ] Test ด้วย `npm run build` ก่อน commit
