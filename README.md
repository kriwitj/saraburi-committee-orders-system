# 📋 ระบบคำสั่งจังหวัดสระบุรี (SAROrders)

ระบบบริหารจัดการคำสั่งแต่งตั้งคณะกรรมการ คณะทำงาน และคณะอนุกรรมการ ของจังหวัดสระบุรี  
พัฒนาด้วย **Next.js 16** + **PostgreSQL** + **Local File Storage**

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 📋 จัดการคำสั่ง | สร้าง แก้ไข ยกเลิก และติดตามสถานะคำสั่ง |
| 👥 รายชื่อคณะ | บริหารจัดการคณะย่อยและรายชื่อกรรมการในแต่ละคณะ |
| 📎 แนบไฟล์ | อัปโหลด PDF / Word / Excel พร้อมดาวน์โหลดผ่าน local storage |
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
| Database | PostgreSQL 16 |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| File Storage | Local filesystem (configurable via `UPLOAD_DIR`) |
| Auth | JWT (`jose`) + bcryptjs |
| Export | `docx` (Word) · `xlsx` (Excel) |
| State | Zustand |
| Deploy | Docker Compose + Nginx |

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
│   └── index.ts                # DB connection (pg Pool)
├── lib/                        # Utilities
│   ├── auth.ts                 # JWT auth helpers
│   ├── exportPdf.ts            # Export PDF
│   ├── exportWord.ts           # Export Word (.docx)
│   ├── storage.ts              # Local file storage helpers
│   └── utils.ts                # Thai date format, helpers
├── types/                      # TypeScript types
│   └── index.ts                # Shared types & constants
├── uploads/                    # ไฟล์แนบ (dev) / mount volume (prod)
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # PostgreSQL + App services
├── nginx.conf                  # ตัวอย่าง Nginx reverse proxy config
├── .env.example                # ตัวอย่าง environment variables
├── drizzle.config.ts           # Drizzle ORM config
└── next.config.ts              # Next.js config (output: standalone)
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
| `blob_url` | text | URL ของไฟล์ (`/api/files/...`) |
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

## 🚀 การติดตั้งสำหรับ Development

### 1. Clone & ติดตั้ง dependencies

```bash
git clone <repository-url>
cd sarorders
npm install
```

### 2. เตรียม PostgreSQL

**วิธีที่ 1 — ใช้ Docker (แนะนำ):**
```bash
docker run -d \
  --name sarorders-dev-db \
  -e POSTGRES_DB=sarorders \
  -e POSTGRES_USER=sarorders \
  -e POSTGRES_PASSWORD=devpassword \
  -p 5432:5432 \
  postgres:16-alpine
```

**วิธีที่ 2 — ติดตั้ง PostgreSQL บนเครื่อง:**
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser sarorders --createdb
sudo -u postgres createdb sarorders --owner=sarorders
sudo -u postgres psql -c "ALTER USER sarorders WITH PASSWORD 'devpassword';"
```

### 3. ตั้งค่า Environment Variables

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
DATABASE_URL=postgresql://sarorders:devpassword@localhost:5432/sarorders
DATABASE_SSL=false
JWT_SECRET=dev-secret-replace-in-production
NEXTAUTH_URL=http://localhost:3000
```

### 4. สร้างตาราง Database

```bash
npm run db:push
```

### 5. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

> **Default Admin Account** — ระบบจะสร้าง admin user อัตโนมัติเมื่อ database ว่าง  
> ตรวจสอบ seed data ใน [`db/queries.ts`](./db/queries.ts) ฟังก์ชัน `seedIfEmpty()`

---

## 🚢 Deploy บน Ubuntu Server

### สถาปัตยกรรม

```
Internet (80/443)
      │
  [Traefik]  /opt/apps/proxy  ← SSL Let's Encrypt + reverse proxy กลาง
      │  proxy_net (Docker network)
  [sarorders-app:3000]        ← Next.js app (container)
      │  sarorders-net
  [sarorders-db:5432]         ← PostgreSQL (container)
```

- **Traefik** รันเป็น service กลางที่ `/opt/apps/proxy` ดูแล SSL และ routing ให้ทุก app
- **proxy_net** คือ Docker network ที่ Traefik ใช้ discover services ผ่าน container labels
- **Let's Encrypt** ออก SSL certificate อัตโนมัติผ่าน HTTP challenge

---

### ความต้องการของระบบ

- Ubuntu 22.04 LTS หรือใหม่กว่า
- Docker Engine 24.x+ และ Docker Compose v2.x+
- Domain พร้อม DNS A record ชี้มาที่ server IP (**ต้องปิด Cloudflare proxy**)
- Port 80 และ 443 เปิดอยู่

---

### ขั้นตอนที่ 1 — ตั้งค่า Traefik Proxy (ทำครั้งเดียว)

> ถ้า Traefik รันอยู่แล้วที่ `/opt/apps/proxy` ข้ามขั้นตอนนี้ได้

```bash
# สร้าง external network ที่ใช้ร่วมกัน
docker network create proxy_net

# สร้าง directory
mkdir -p /opt/apps/proxy
cd /opt/apps/proxy
```

สร้างไฟล์ `/opt/apps/proxy/docker-compose.yml`:

```yaml
services:
  traefik:
    image: traefik:v3.6
    container_name: proxy-traefik-1
    restart: unless-stopped
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=proxy_net
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --certificatesresolvers.le.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - proxy_net

networks:
  proxy_net:
    external: true
    name: proxy_net
```

```bash
# สร้าง acme.json (permission 600 สำคัญมาก!)
mkdir -p letsencrypt && touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json

# ตั้งค่า email สำหรับ Let's Encrypt
echo "ACME_EMAIL=admin@your-domain.com" > .env

# รัน Traefik
docker compose up -d
```

> ⚠️ **DNS**: domain ต้องชี้ตรงมาที่ server IP โดยไม่ผ่าน Cloudflare proxy (grey cloud)

---

### ขั้นตอนที่ 2 — Deploy SAROrders

#### 2.1 Clone โปรเจกต์

```bash
git clone <repository-url> /opt/apps/saraburi-committee-orders-system
cd /opt/apps/saraburi-committee-orders-system
```

#### 2.2 ตั้งค่า Environment Variables

```bash
cp .env.example .env
nano .env
```

```env
DOMAIN=orders.your-domain.com
NEXTAUTH_URL=https://orders.your-domain.com
DB_PASSWORD=your-strong-password         # openssl rand -base64 24
JWT_SECRET=your-super-secret-jwt-key     # openssl rand -base64 32
```

#### 2.3 Build และรัน

```bash
docker compose up -d --build

# ตรวจสอบ
docker compose ps
docker compose logs -f app
```

#### 2.4 Sync database schema (ครั้งแรกเท่านั้น)

```bash
docker compose run --rm migrate
```

> `migrate` service ใช้ `Dockerfile.migrate` ที่รวม drizzle-kit ไว้ รัน push แล้วลบ container ทิ้งอัตโนมัติ (`--rm`)  
> ไม่ได้รันพร้อม `docker compose up` ปกติ เพราะใช้ `profiles: [migrate]`

เปิดเบราว์เซอร์ที่ `https://orders.your-domain.com` — Traefik จะออก SSL certificate อัตโนมัติภายใน 1-2 นาที

---

## 🔄 อัปเดตโปรเจกต์

```bash
cd /opt/apps/saraburi-committee-orders-system

# ดึงโค้ดล่าสุด
git pull

# Rebuild และ restart
docker compose up -d --build

# (ถ้ามีการเปลี่ยน schema)
docker compose run --rm migrate
```

---

## 🔍 Troubleshooting

```bash
# ดู log ของ app
docker compose logs -f app

# ดู Traefik routing และ SSL cert
docker logs proxy-traefik-1 2>&1 | grep -i "your-domain\|acme\|error"

# ตรวจสอบ app อยู่ใน proxy_net ไหม
docker network inspect proxy_net | grep sarorders

# ถ้าไม่อยู่ใน proxy_net
docker network connect proxy_net sarorders-app

# ทดสอบ HTTP routing ผ่าน Traefik
curl -H "Host: orders.your-domain.com" http://localhost
```

---

## 💾 การสำรองข้อมูล

### Backup PostgreSQL

```bash
cd /opt/apps/saraburi-committee-orders-system

# Backup
docker compose exec db pg_dump -U sarorders sarorders > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U sarorders sarorders < backup_20250101.sql
```

### Backup ไฟล์แนบ

```bash
docker run --rm \
  -v sarorders_uploads:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
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

## 🔧 Environment Variables Reference

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `DATABASE_SSL` | — | `false` | เปิด SSL สำหรับ DB connection |
| `JWT_SECRET` | ✅ | — | Secret สำหรับ sign JWT tokens |
| `UPLOAD_DIR` | — | `./uploads` | โฟลเดอร์เก็บไฟล์แนบ |
| `NEXTAUTH_URL` | — | `http://localhost:3000` | URL ของแอปพลิเคชัน |

---

## 📝 การพัฒนาเพิ่มเติม

- ไฟล์ database schema อยู่ที่ [db/schema.ts](./db/schema.ts)
- Database queries อยู่ที่ [db/queries.ts](./db/queries.ts)
- ดู [CLAUDE.md](./CLAUDE.md) สำหรับคำแนะนำการทำงานร่วมกับ AI assistant

---

## 📄 License

Private — จังหวัดสระบุรี © 2568
