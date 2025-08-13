import { Button } from "@/components/ui/button"
import { PawPrint } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] p-8">
      <div className="text-center">
        <PawPrint className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          欢迎来到 <span className="text-primary">罐头健康管家</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">一个由AI驱动的宠物护理管理应用，让爱宠生活更简单。</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/auth/login">
            <Button size="lg">开始使用</Button>
          </Link>
          <Button size="lg" variant="outline">
            了解更多
          </Button>
        </div>
      </div>
    </main>
  )
}