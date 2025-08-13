"use client"

import { useState } from "react"
import { CheckCircle2, Circle, AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Todo {
  id: string
  title: string
  description?: string
  status: 'pending' | 'completed' | 'skipped'
  priority: 'high' | 'medium' | 'low'
  dueDate?: Date
  category?: string
}

interface TodoListProps {
  petId: string
  showFilters?: boolean
  showHeader?: boolean
  maxHeight?: string
  className?: string
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800"
}

const mockTodos: Todo[] = [
  {
    id: "1",
    title: "给爱宠洗澡",
    description: "使用温水和宠物专用洗发水",
    status: "pending",
    priority: "high",
    category: "清洁护理"
  },
  {
    id: "2",
    title: "接种疫苗提醒",
    description: "下周三带去宠物医院接种狂犬疫苗",
    status: "pending",
    priority: "high",
    category: "健康"
  },
  {
    id: "3",
    title: "购买狗粮",
    description: "目前的狗粮还能吃3-5天",
    status: "pending",
    priority: "medium",
    category: "饮食"
  }
]

export default function TodoList({ 
  petId, // eslint-disable-line @typescript-eslint/no-unused-vars
  showFilters = true, 
  showHeader = true,
  maxHeight = "none",
  className 
}: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(mockTodos)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const handleToggleTodo = (todoId: string) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, status: todo.status === 'completed' ? 'pending' : 'completed' }
        : todo
    ))
  }

  const handleSkipTodo = (todoId: string) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, status: 'skipped' }
        : todo
    ))
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return todo.status !== 'skipped'
    return todo.status === filter
  })

  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">待办任务</h3>
          {showFilters && (
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                待完成
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                已完成
              </Button>
            </div>
          )}
        </div>
      )}

      <div 
        className={cn(
          "space-y-2",
          maxHeight !== "none" && `overflow-y-auto pr-2`
        )}
        style={{ maxHeight }}
      >
        {filteredTodos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">暂无待办任务</p>
            </CardContent>
          </Card>
        ) : (
          filteredTodos.map((todo) => (
            <Card key={todo.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTodo(todo.id)}
                    className="mt-0.5 text-gray-500 hover:text-primary transition-colors"
                  >
                    {todo.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-medium",
                        todo.status === 'completed' && "line-through text-gray-500"
                      )}>
                        {todo.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", priorityColors[todo.priority])}
                      >
                        {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}优先级
                      </Badge>
                      {todo.category && (
                        <Badge variant="outline" className="text-xs">
                          {todo.category}
                        </Badge>
                      )}
                    </div>
                    {todo.description && (
                      <p className={cn(
                        "text-sm text-gray-600",
                        todo.status === 'completed' && "line-through"
                      )}>
                        {todo.description}
                      </p>
                    )}
                  </div>

                  {todo.status === 'pending' && (
                    <button
                      onClick={() => handleSkipTodo(todo.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="跳过此任务"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}