"use client"

import { useActionState, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createPetProfile } from "./actions"

const initialState = {
  message: "",
}

export default function AddPetPage() {
  const [state, formAction, isPending] = useActionState(createPetProfile, initialState)
  const [birthday, setBirthday] = useState<Date | undefined>()
  const router = useRouter()

  if (state?.message === "Success") {
    // Redirect on success
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">为您的宠物创建档案</h1>
        <p className="mt-2 text-gray-600">让我们为您的爱宠建立健康档案</p>
      </div>

      <form action={formAction} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium text-gray-700">
            宠物姓名 *
          </Label>
          <Input id="name" name="name" className="h-12 rounded-lg bg-gray-100 px-4" placeholder="例如：旺财" required />
          {state && 'errors' in state && (state as any).errors?.name && <p className="text-sm text-red-500">{(state as any).errors.name[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed" className="text-base font-medium text-gray-700">
            宠物品种 *
          </Label>
          <Input
            id="breed"
            name="breed"
            className="h-12 rounded-lg bg-gray-100 px-4"
            placeholder="例如：金毛犬"
            required
          />
          {state && 'errors' in state && (state as any).errors?.breed && <p className="text-sm text-red-500">{(state as any).errors.breed[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday" className="text-base font-medium text-gray-700">
            出生日期 *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full h-12 justify-start text-left font-normal rounded-lg bg-gray-100 hover:bg-gray-100 border-gray-200",
                  !birthday && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthday ? format(birthday, "yyyy年MM月dd日") : <span>选择日期</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={birthday} onSelect={setBirthday} initialFocus />
            </PopoverContent>
          </Popover>
          <input type="hidden" name="birthday" value={birthday?.toISOString()} />
          {state && 'errors' in state && (state as any).errors?.birthday && <p className="text-sm text-red-500">{(state as any).errors.birthday[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-base font-medium text-gray-700">
            所在城市 *
          </Label>
          <Input 
            id="city" 
            name="city" 
            className="h-12 rounded-lg bg-gray-100 px-4" 
            placeholder="例如：北京" 
            required 
          />
          {state && 'errors' in state && (state as any).errors?.city && <p className="text-sm text-red-500">{(state as any).errors.city[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-700">宠物性别</Label>
          <ToggleGroup type="single" className="grid grid-cols-3 gap-4">
            <ToggleGroupItem
              value="MALE"
              className="h-12 rounded-lg border-2 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:border-primary"
            >
              雄性
            </ToggleGroupItem>
            <ToggleGroupItem
              value="FEMALE"
              className="h-12 rounded-lg border-2 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:border-primary"
            >
              雌性
            </ToggleGroupItem>
            <ToggleGroupItem
              value="UNKNOWN"
              className="h-12 rounded-lg border-2 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:border-primary"
            >
              未知
            </ToggleGroupItem>
          </ToggleGroup>
          {state && 'errors' in state && (state as any).errors?.gender && <p className="text-sm text-red-500">{(state as any).errors.gender[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="microchip_id" className="text-base font-medium text-gray-700">
            芯片号码 (可选)
          </Label>
          <Input 
            id="microchip_id" 
            name="microchip_id" 
            className="h-12 rounded-lg bg-gray-100 px-4" 
            placeholder="输入宠物芯片号码"
          />
          {state && 'errors' in state && (state as any).errors?.microchip_id && <p className="text-sm text-red-500">{(state as any).errors.microchip_id[0]}</p>}
          <p className="text-sm text-gray-500">芯片号码通常为10-15位数字</p>
        </div>

        {state?.message && !state.message.includes("Success") && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800 text-sm">{state.message}</p>
          </div>
        )}

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isPending}>
          {isPending ? "创建中..." : "创建宠物档案"}
        </Button>
      </form>
    </div>
  )
}
