import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "罐头健康管家",
  description: "AI驱动的宠物健康管理应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.className} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
