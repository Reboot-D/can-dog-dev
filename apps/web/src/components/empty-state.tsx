import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onAddPet?: () => void
}

export default function EmptyState({ onAddPet }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <PlusCircle className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">还没有宠物</h2>
          <p className="text-gray-600">
            点击下方按钮添加您的第一个宠物，开始记录它的健康和日常护理。
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={onAddPet}>
          <PlusCircle className="h-5 w-5" />
          添加宠物
        </Button>
      </div>
    </div>
  )
}