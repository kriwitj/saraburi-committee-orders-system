# ─────────────────────────────────────────────────────────────
# Stage 1: ติดตั้ง dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# ติดตั้ง packages ที่ต้องการสำหรับ native modules
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --only=production && npm ci

# ─────────────────────────────────────────────────────────────
# Stage 2: Build application
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DATABASE_URL สำหรับ build phase เท่านั้น
# ค่าจริงถูก inject ตอน runtime ผ่าน docker-compose env
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=$DATABASE_URL

# NEXT_PUBLIC_* ถูก inline เข้า bundle ตอน build — ต้องส่งมาเป็น ARG
ARG NEXT_PUBLIC_SSO_ENABLED=false
ENV NEXT_PUBLIC_SSO_ENABLED=$NEXT_PUBLIC_SSO_ENABLED

# Build Next.js app (output: standalone)
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 3: Production runner (เล็กที่สุด)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# สร้าง system user สำหรับรัน app (ไม่รันเป็น root)
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# คัดลอกเฉพาะไฟล์ที่จำเป็นสำหรับ production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# สร้างโฟลเดอร์สำหรับเก็บไฟล์แนบ
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# เปลี่ยน user
USER nextjs

EXPOSE 3000

# รัน standalone server.js ที่ Next.js สร้างให้
CMD ["node", "server.js"]
