@AGENTS.md

# 🤖 Claude-Specific Instructions — SAROrders

คำแนะนำเพิ่มเติมสำหรับ Claude เมื่อทำงานกับโปรเจกต์นี้

---

## 🎯 Project Context

ระบบนี้พัฒนาสำหรับ **จังหวัดสระบุรี** ใช้บริหารจัดการ "คำสั่งแต่งตั้ง" คณะกรรมการ คณะทำงาน และคณะอนุกรรมการ
เป็น internal web app ที่มีทั้ง public landing page และ admin section

---

## 📐 Code Style & Preferences

- **ภาษา:** TypeScript strict — หลีกเลี่ยง `any` ให้มากที่สุด
- **Styling:** Tailwind CSS v4 — ใช้ utility classes โดยตรง ไม่ใช้ custom CSS ยกเว้นจำเป็น
- **Component Style:** Functional components + hooks เท่านั้น
- **เนื้อหา UI:** ภาษาไทย (UI labels, messages, etc.)
- **Dates:** ใช้ Buddhist Era (พ.ศ.) ผ่าน `formatThDate()` และ `thYear()` ใน `lib/utils.ts`
- **IDs:** ใช้ UUID (random string) ทุกตาราง
- **Error Handling:** Return `NextResponse.json({ error: '...' }, { status: NNN })`

---

## 🔑 Key Files to Know

| ไฟล์ | ความสำคัญ |
|---|---|
| [`db/schema.ts`](./db/schema.ts) | Database tables — อ่านก่อนแก้ไข data layer |
| [`db/queries.ts`](./db/queries.ts) | Query functions — เพิ่ม query ที่นี่ |
| [`lib/auth.ts`](./lib/auth.ts) | JWT helpers — `getAuthUser()` สำคัญมาก |
| [`types/index.ts`](./types/index.ts) | Shared types + constants (STATUS_LABELS, etc.) |
| [`lib/utils.ts`](./lib/utils.ts) | Thai date helpers |
| [`components/ui.tsx`](./components/ui.tsx) | Reusable UI components |

---

## ⚡ Common Patterns

### ตรวจสอบ Auth ใน API Route
```typescript
import { getAuthUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... logic
}
```

### เพิ่ม Query ใน Drizzle
```typescript
// db/queries.ts
import { db } from './index';
import { orders } from './schema';
import { eq } from 'drizzle-orm';

export async function getOrderById(id: string) {
  return db.select().from(orders).where(eq(orders.id, id)).limit(1);
}
```

### Thai Date Format
```typescript
import { formatThDate, thYear } from '@/lib/utils';
formatThDate('2025-05-24') // "24 พฤษภาคม 2568"
thYear('2025')             // "2568"
```

---

## 🚫 สิ่งที่ไม่ควรทำ

- **อย่า** ใช้ `pages/` directory — โปรเจกต์ใช้ App Router เท่านั้น
- **อย่า** import `@neondatabase/serverless` หรือ `@vercel/blob` — ถูกเอาออกแล้ว ใช้ `pg` + local storage แทน
- **อย่า** ใช้ raw SQL ตรงๆ — ใช้ Drizzle ORM
- **อย่า** ลืม check role ก่อน mutation (ADMIN/EDITOR)
- **อย่า** ใช้ `cookies()` หรือ `headers()` โดยไม่ `await` (Next.js 16)
- **อย่า** สร้าง component ใหม่ถ้ามีใน `components/ui.tsx` อยู่แล้ว

---

## 🧪 การ Test

```bash
npm run build    # ตรวจสอบ TypeScript errors และ build errors
npm run lint     # ESLint
npm run db:push  # ตรวจสอบ schema sync
```

ไม่มี unit test framework ในโปรเจกต์นี้ — ตรวจสอบผ่าน build + manual test

---

## 📦 Dependencies ที่ควรรู้

| Package | ใช้ทำอะไร |
|---|---|
| `drizzle-orm` | ORM สำหรับ PostgreSQL |
| `pg` | Node.js PostgreSQL driver (connection pool) |
| `jose` | JWT sign/verify |
| `bcryptjs` | Password hashing |
| `docx` | Export Word documents |
| `xlsx` | Export/Import Excel |
| `zustand` | State management |

---

## 🔍 เมื่อต้องการเพิ่ม Feature ใหม่

1. ดู schema ใน [`db/schema.ts`](./db/schema.ts) — มีตารางที่ต้องการหรือเปล่า?
2. เพิ่ม query ใน [`db/queries.ts`](./db/queries.ts)
3. สร้าง API route ใน `app/api/[feature]/route.ts`
4. เพิ่ม/แก้ไข component ใน `components/`
5. เชื่อม UI กับ API route ใน page component
6. Run `npm run build` ตรวจสอบ errors
