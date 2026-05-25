import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // สร้าง standalone output สำหรับ deploy บน Docker/Ubuntu server
  // ได้ไฟล์ .next/standalone/server.js ที่รันได้โดยตรงโดยไม่ต้อง node_modules เต็มๆ
  output: "standalone",
};

export default nextConfig;
