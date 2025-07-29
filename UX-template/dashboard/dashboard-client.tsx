"use client"

import { useState } from "react"
import { Plus, Heart } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import EmptyState from "@/components/empty-state"
import TodoList from "@/components/todo-list"
import type { Pet, AiTodo } from "@/types/database"

interface DashboardClientProps {
  pets: Pet[]
  todos: (AiTodo & { pets: { name: string; breed_primary: string } })[]
  userName: string
}

// Calculate pet age
const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate)
  const today = new Date()
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                      (today.getMonth() - birth.getMonth())
  
  if (ageInMonths < 12) {
    return `${ageInMonths}个月`
  } else {
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12
    return months > 0 ? `${years}岁${months}个月` : `${years}岁`
  }
}

export default function DashboardClient({ pets, todos, userName }: DashboardClientProps) {

  // Show empty state if no pets
  if (pets.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="relative w-full">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            早上好，{userName}
          </h1>
          <p className="text-gray-600 mt-2">今天为您的爱宠安排了 {todos.length} 个任务</p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">您的宠物</h2>
            <Link href="/dashboard/add-pet">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加宠物
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pets.map((pet) => (
              <Link href={`/dashboard/pets/${pet.id}`} key={pet.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      {pet.profile_photo_url ? (
                        <Image
                          src={pet.profile_photo_url}
                          alt={`${pet.name}的照片`}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <Heart className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{pet.name}</p>
                    <p className="text-xs text-gray-500">{pet.breed_primary}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {calculateAge(pet.date_of_birth)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* AI任务列表 - 显示所有宠物的待办任务 */}
        {pets.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              AI待办任务 {todos.length > 0 && `(${todos.length})`}
            </h2>
            {/* 为第一个宠物显示任务列表，之后可以扩展为显示所有宠物的任务 */}
            <TodoList 
              petId={pets[0].id} 
              showFilters={false}
              showHeader={false}
              maxHeight="400px"
              className="mt-4"
            />
          </div>
        )}
      </div>

      <Link href="/dashboard/add-pet">
        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90">
          <Plus className="h-8 w-8" />
        </Button>
      </Link>
    </div>
  )
}