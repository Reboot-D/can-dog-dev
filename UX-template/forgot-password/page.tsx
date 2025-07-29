"use client"

import { useActionState } from "react"
import { PawPrint, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendPasswordReset } from "./actions"

const initialState = {
  message: "",
  success: false,
}

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendPasswordReset, initialState)

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="flex h-20 items-center border-b px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <PawPrint className="h-6 w-6 text-primary" />
          <span className="text-lg">罐头健康管家</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">重置密码</h1>
            <p className="mt-2 text-gray-600">输入您的邮箱地址，我们将发送重置密码的链接</p>
          </div>
          
          {state?.success ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
              <h2 className="font-semibold text-green-800 mb-2">邮件已发送！</h2>
              <p className="text-green-700 text-sm">
                我们已向您的邮箱发送了重置密码的链接。请检查您的邮箱（包括垃圾邮件文件夹）并点击链接重置密码。
              </p>
              <div className="mt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回登录
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {state?.message && !state?.success && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <p className="text-red-800 text-sm">{state.message}</p>
                </div>
              )}
              <form action={formAction} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="输入您的邮箱地址"
                    required
                    type="email"
                    className="bg-[#F3F4F6] h-12 rounded-full px-4"
                  />
                  {state && 'errors' in state && (state as any).errors?.email && (
                    <p className="text-red-600 text-sm">{(state as any).errors.email[0]}</p>
                  )}
                </div>
                <Button 
                  className="w-full h-12 rounded-full text-base font-semibold" 
                  type="submit" 
                  disabled={isPending}
                >
                  {isPending ? "发送中..." : "发送重置链接"}
                </Button>
              </form>
              <div className="text-center text-sm">
                <Link href="/login" className="text-gray-500 hover:underline inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  返回登录
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}