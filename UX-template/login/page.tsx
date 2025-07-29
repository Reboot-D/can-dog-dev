"use client"

import { useActionState } from "react"
import { PawPrint } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginUser } from "./actions"

const initialState = {
  message: "",
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginUser, initialState)

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
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">AI驱动的宠物护理助手</h1>
            <p className="mt-2 text-gray-600">通过AI引导的待办任务，让宠物护理变得简单</p>
          </div>
          {state?.message && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-red-800 text-sm">{state.message}</p>
            </div>
          )}
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                placeholder="输入您的邮箱"
                required
                type="email"
                className="bg-[#F3F4F6] h-12 rounded-full px-4"
              />
              {state && 'errors' in state && (state as any).errors?.email && (
                <p className="text-red-600 text-sm">{(state as any).errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                placeholder="输入您的密码"
                required
                type="password"
                className="bg-[#F3F4F6] h-12 rounded-full px-4"
              />
              {state && 'errors' in state && (state as any).errors?.password && (
                <p className="text-red-600 text-sm">{(state as any).errors.password[0]}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="font-normal">
                  记住我
                </Label>
              </div>
            </div>
            <Button className="w-full h-12 rounded-full text-base font-semibold" type="submit" disabled={isPending}>
              {isPending ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <p>
              {"还没有账户？ "}
              <Link href="/apply" className="font-medium text-primary hover:underline">
                申请加入
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/forgot-password" className="text-gray-500 hover:underline">
                忘记密码？
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
