import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
export const metadata: Metadata = {
  title: "ระบบคำสั่งจังหวัดสระบุรี",
  description: "ระบบจัดเก็บคำสั่งคณะกรรมการ/คณะทำงาน จังหวัดสระบุรี",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
