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
