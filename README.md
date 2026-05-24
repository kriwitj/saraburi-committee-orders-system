# 📋 ระบบคำสั่งจังหวัดสระบุรี (SAROrders)

ระบบบริหารจัดการคำสั่งแต่งตั้งคณะกรรมการ คณะทำงาน และคณะอนุกรรมการ ของจังหวัดสระบุรี
พัฒนาด้วย **Next.js 16** + **PostgreSQL (Neon)** + **Vercel Blob Storage**

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 📋 จัดการคำสั่ง | สร้าง แก้ไข ยกเลิก และติดตามสถานะคำสั่ง |
| 👥 รายชื่อคณะ | บริหารจัดการคณะย่อยและรายชื่อกรรมการในแต่ละคณะ |
| 📎 แนบไฟล์ | อัปโหลด PDF / Word / Excel พร้อมดาวน์โหลดผ่าน Vercel Blob |
| 📊 ส่งออกเอกสาร | Export รายชื่อคณะกรรมการเป็นไฟล์ Word (`.docx`) หรือ Excel (`.xlsx`) |
| 🔐 ระบบสิทธิ์ | 3 ระดับ: ADMIN / EDITOR / VIEWER พร้อม JWT Authentication |
| 🔍 ค้นหา | ค้นหาคำสั่งพร้อม filter ละเอียดตามประเภท / หน่วยงาน / ปี |
| 🌐 หน้าสาธารณะ | Landing page แสดงคำสั่งทั้งหมดโดยไม่ต้อง login |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via [Neon Serverless](https://neon.tech) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| File Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| Auth | JWT (`jose`) + bcryptjs |
| Export | `docx` (Word) · `xlsx` (Excel) |
| State | Zustand |

---

## 📁 โครงสร้างโปรเจกต์

```
sarorders/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing page (สาธารณะ)
│   ├── login/                  # หน้า Login
│   ├── orders/                 # จัดการคำสั่ง (ต้อง login)
│   ├── my-orders/              # คำสั่งของฉัน
│   ├── search/                 # ค้นหาคำสั่ง
│   ├── settings/               # ตั้งค่าระบบ & จัดการผู้ใช้
│   │   └── users/              # จัดการผู้ใช้ (ADMIN only)
│   └── api/                    # API Routes
│       ├── auth/               # login / logout / me
│       ├── orders/             # CRUD คำสั่ง
│       ├── agencies/           # จัดการหน่วยงาน
│       ├── users/              # จัดการผู้ใช้
│       ├── files/              # อัปโหลด/ดาวน์โหลดไฟล์
│       ├── import/             # นำเข้าข้อมูล (Excel)
│       ├── settings/           # ตั้งค่าระบบ
│       ├── stats/              # สถิติ
│       └── public/orders/      # API สาธารณะ (ไม่ต้อง auth)
├── components/                 # React Components
│   ├── AdminLayout.tsx         # Layout หลักสำหรับหน้า admin
│   ├── AttachmentsPanel.tsx    # Panel จัดการไฟล์แนบ
│   ├── DetailView.tsx          # หน้ารายละเอียดคำสั่ง
│   ├── forms.tsx               # Form components ต่างๆ
│   ├── ListView.tsx            # รายการคำสั่ง
│   ├── Navbar.tsx              # Navigation bar
│   ├── providers.tsx           # React context providers
│   └── ui.tsx                  # UI components ทั่วไป
├── db/                         # Database layer
│   ├── schema.ts               # Drizzle schema (tables)
│   ├── queries.ts              # Database queries
│   └── index.ts                # DB connection
├── lib/                        # Utilities
│   ├── auth.ts                 # JWT auth helpers
│   ├── exportPdf.ts            # Export PDF
│   ├── exportWord.ts           # Export Word (.docx)
│   ├── storage.ts              # Vercel Blob helpers
│   └── utils.ts                # Thai date format, helpers
├── types/                      # TypeScript types
│   └── index.ts                # Shared types & constants
├── data/                       # Static data
├── scripts/                    # Utility scripts
├── uploads/                    # Local file uploads (dev)
├── .env.example                # ตัวอย่าง environment variables
├── drizzle.config.ts           # Drizzle ORM config
└── next.config.ts              # Next.js config
```

---

## 🗃️ Database Schema

### `agencies` — หน่วยงาน
| Column | Type | Description |
|---|---|---|
| `id` | text PK | UUID |
| `name` | text UNIQUE | ชื่อหน่วยงาน |
| `created_at` | text | วันที่สร้าง |

### `users` — ผู้ใช้งาน
| Column | Type | Description |
|---|---|---|
| `id` | text PK | UUID |
| `email` | text UNIQUE | อีเมล |
| `prefix` | text | คำนำหน้าชื่อ |
| `name` | text | ชื่อ-สกุล |
| `agency_id` | text FK | สังกัดหน่วยงาน |
| `password_hash` | text | รหัสผ่าน (bcrypt) |
| `role` | text | `ADMIN` / `EDITOR` / `VIEWER` |

### `orders` — คำสั่ง
| Column | Type | Description |
|---|---|---|
| `id` | text PK | UUID |
| `order_number` | text | เลขที่คำสั่ง |
| `order_date` | text | วันที่ออกคำสั่ง |
| `effective_date` | text | วันที่มีผล |
| `type` | text | ประเภท (คณะกรรมการ / คณะทำงาน / คณะอนุกรรมการ) |
| `title` | text | ชื่อ/เรื่องคำสั่ง |
| `background` | text | ที่มา/หลักการและเหตุผล |
| `signed_by` | text | ผู้ลงนาม |
| `signed_by_title` | text | ตำแหน่งผู้ลงนาม |
| `status` | text | `ACTIVE` / `CANCELLED` / `DRAFT` / `DELETED` |
| `cancel_reason` | text | เหตุผลการยกเลิก |
| `agency_id` | text FK | หน่วยงานที่ออกคำสั่ง |

### `sub_committees` — คณะย่อย
| Column | Type | Description |
|---|---|---|
| `id` | text PK | UUID |
| `order_id` | text FK | คำสั่งที่สังกัด |
| `name` | text | ชื่อคณะย่อย |
| `seq` | integer | ลำดับ |
| `duties` | text | อำนาจหน้าที่ |

### `members` — สมาชิกคณะ
| Column | Type | Description |
|---|---|---|
| `id` | text PK | UUID |
| `sub_committee_id` | text FK | คณะย่อยที่สังกัด |
| `name` | text | ชื่อ-สกุล |
| `agency_position` | text | ตำแหน่งในหน่วยงาน |
| `agency` | text | หน่วยงาน |
| `role` | text | บทบาทในคณะ (ประธาน / เลขา / กรรมการ) |
| `seq` | integer | ลำดับ |

### `attachments` — ไฟล์แนบ
| Column | Type | Description |
|---|---|---|
| `id` | text PK | UUID |
| `order_id` | text FK | คำสั่งที่สังกัด |
| `filename` | text | ชื่อไฟล์ (stored) |
| `original_name` | text | ชื่อไฟล์ต้นฉบับ |
| `file_type` | text | `PDF` / `WORD` / `EXCEL` |
| `blob_url` | text | URL จาก Vercel Blob |
| `size` | integer | ขนาดไฟล์ (bytes) |

---

## 🔐 ระบบสิทธิ์ผู้ใช้

| Role | ดูสาธารณะ | Login | ดูคำสั่งทั้งหมด | สร้าง/แก้ไข | จัดการผู้ใช้ |
|---|:---:|:---:|:---:|:---:|:---:|
| สาธารณะ | ✅ | — | — | — | — |
| VIEWER | ✅ | ✅ | ✅ | — | — |
| EDITOR | ✅ | ✅ | ✅ | ✅ | — |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🚀 การติดตั้งและรันโปรเจกต์

### 1. Clone & ติดตั้ง dependencies

```bash
git clone <repository-url>
cd sarorders
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# PostgreSQL connection string จาก Neon
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT Secret (สุ่มค่าที่ปลอดภัยสำหรับ production)
JWT_SECRET=your-super-secret-jwt-key-here

# Vercel Blob Storage Token
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# URL ของแอปพลิเคชัน
NEXTAUTH_URL=http://localhost:3000
```

### 3. สร้างตาราง Database

```bash
npm run db:push
```

### 4. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### 5. ดู Database ด้วย Drizzle Studio

```bash
npm run db:studio
```

---

## 📜 คำสั่ง (Scripts)

| คำสั่ง | ความหมาย |
|---|---|
| `npm run dev` | รัน development server |
| `npm run build` | Build สำหรับ production |
| `npm run start` | รัน production server |
| `npm run lint` | ตรวจสอบ code ด้วย ESLint |
| `npm run db:push` | Push schema ไปยัง database |
| `npm run db:studio` | เปิด Drizzle Studio |

---

## 🌐 API Endpoints

### Public (ไม่ต้อง Authentication)
| Method | Path | Description |
|---|---|---|
| GET | `/api/public/orders` | ดึงรายการคำสั่งทั้งหมด (สาธารณะ) |
| GET | `/api/agencies` | ดึงรายการหน่วยงาน |

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน |

### Orders (ต้อง Login)
| Method | Path | Description |
|---|---|---|
| GET | `/api/orders` | ดึงรายการคำสั่ง |
| POST | `/api/orders` | สร้างคำสั่งใหม่ |
| GET | `/api/orders/[id]` | ดูรายละเอียดคำสั่ง |
| PUT | `/api/orders/[id]` | แก้ไขคำสั่ง |
| DELETE | `/api/orders/[id]` | ลบคำสั่ง |

### Files
| Method | Path | Description |
|---|---|---|
| POST | `/api/files` | อัปโหลดไฟล์แนบ |
| GET | `/api/files/[filename]` | ดาวน์โหลดไฟล์ |

### Admin (ADMIN only)
| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | รายการผู้ใช้ทั้งหมด |
| POST | `/api/users` | สร้างผู้ใช้ใหม่ |
| PUT | `/api/users/[uid]` | แก้ไขข้อมูลผู้ใช้ |
| DELETE | `/api/users/[uid]` | ลบผู้ใช้ |
| GET | `/api/agencies` | รายการหน่วยงาน |
| POST | `/api/agencies` | สร้างหน่วยงาน |
| GET | `/api/stats` | สถิติภาพรวม |
| POST | `/api/import` | นำเข้าข้อมูลจาก Excel |

---

## 🚢 การ Deploy

### Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. เชื่อมต่อ repository กับ [Vercel](https://vercel.com)
3. ตั้งค่า Environment Variables ใน Vercel Dashboard:
   - `DATABASE_URL` — PostgreSQL connection string (Neon)
   - `JWT_SECRET` — Secret key สำหรับ JWT
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob token
4. Deploy!

> **หมายเหตุ:** โปรเจกต์นี้ใช้ Next.js 16 ซึ่งมี breaking changes จากเวอร์ชันก่อนหน้า
> ดูไฟล์ [AGENTS.md](./AGENTS.md) สำหรับข้อมูลเพิ่มเติมสำหรับ AI agents

---

## 📝 การพัฒนาเพิ่มเติม

- ไฟล์ database schema อยู่ที่ [db/schema.ts](./db/schema.ts)
- Database queries อยู่ที่ [db/queries.ts](./db/queries.ts)
- ดู [CLAUDE.md](./CLAUDE.md) สำหรับคำแนะนำการทำงานร่วมกับ AI assistant

---

## 📄 License

Private — จังหวัดสระบุรี © 2025
