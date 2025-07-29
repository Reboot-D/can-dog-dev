"use client"

import { useActionState } from "react"
import { PawPrint, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitApplication } from "./actions"

const initialState = {
  message: "",
}

export default function ApplyPage() {
  const [state, formAction, isPending] = useActionState(submitApplication, initialState)

  if (state?.message.includes("Success")) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
        <header className="flex h-20 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="text-lg">罐头健康管家</span>
          </Link>
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-lg text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
            <h1 className="mt-4 text-3xl font-bold">申请已提交！</h1>
            <p className="mt-2 text-gray-600">
              感谢您的申请！我们将在24小时内审核您的申请并与您联系。
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button>返回首页</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="flex h-20 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <PawPrint className="h-6 w-6 text-primary" />
          <span className="text-lg">Pet Health Manager</span>
        </Link>
        <Avatar>
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">申请加入罐头健康管家</h1>
          </div>
          {state?.message && !state.message.includes("Success") && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-red-800 text-sm">{state.message}</p>
            </div>
          )}
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="sr-only">
                姓名
              </Label>
              <Input id="name" name="name" placeholder="姓名" required className="h-12 rounded-xl bg-[#F3F4F6] px-4" />
              {state && 'errors' in state && (state as any).errors?.name && (
                <p className="text-red-600 text-sm">{(state as any).errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="sr-only">
                邮箱
              </Label>
              <Input
                id="email"
                name="email"
                placeholder="邮箱"
                required
                type="email"
                className="h-12 rounded-xl bg-[#F3F4F6] px-4"
              />
              {state && 'errors' in state && (state as any).errors?.email && (
                <p className="text-red-600 text-sm">{(state as any).errors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="sr-only">
                密码
              </Label>
              <Input
                id="password"
                name="password"
                placeholder="密码（至少6个字符）"
                required
                type="password"
                className="h-12 rounded-xl bg-[#F3F4F6] px-4"
              />
              {state && 'errors' in state && (state as any).errors?.password && (
                <p className="text-red-600 text-sm">{(state as any).errors.password[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="sr-only">
                申请理由
              </Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="请简单介绍一下您和您的宠物"
                required
                className="min-h-[120px] rounded-xl bg-[#F3F4F6] px-4 py-3"
              />
              {state && 'errors' in state && (state as any).errors?.reason && (
                <p className="text-red-600 text-sm">{(state as any).errors.reason[0]}</p>
              )}
            </div>
            <Button className="w-full h-12 rounded-full text-base font-semibold" type="submit" disabled={isPending}>
              {isPending ? "提交中..." : "提交申请"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500">我们将在24小时内审核您的申请。</p>
        </div>
      </main>
    </div>
  )
}
