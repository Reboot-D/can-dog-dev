import { CheckCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function PendingReviewPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-4">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
        <CardContent className="p-0">
          <Image
            alt="等待审核的可爱猫咪"
            className="h-auto w-full object-cover"
            height={400}
            src="/placeholder.svg?height=400&width=450"
            style={{
              aspectRatio: "450/400",
              objectFit: "cover",
            }}
            width={450}
          />
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <CheckCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">申请已提交</h3>
              <p className="text-sm text-gray-600">
                感谢您的申请！我们正在审核中，请耐心等待邮件通知。
              </p>
            </div>
          </div>
          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full rounded-full border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
            >
              返回首页
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
