import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { validateConfig } from "@/lib/config"

const inter = Inter({ subsets: ["latin"] })

// 在服务器端验证环境配置
if (typeof window === 'undefined') {
  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error; // 生产环境中终止应用启动
    }
  }
}

export const metadata: Metadata = {
  title: "罐头健康管家",
  description: "AI驱动的宠物健康管理应用",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={cn("min-h-screen font-sans antialiased", inter.className)}>
        {children}
      </body>
    </html>
  )
}
