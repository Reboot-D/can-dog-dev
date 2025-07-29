// Epic 004: Event Tracking System - Event Detail Client Component
// Task 004-02-02: 实现事件详情页面

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  FileText,
  AlertCircle
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EventEditDialog } from '@/components/events/event-edit-dialog'
import { EventDeleteDialog } from '@/components/events/event-delete-dialog'
import { getEvent, deleteEvent } from '../actions'
import { EVENT_TYPE_CONFIG } from '@/lib/validations/event'

interface Event {
  id: string
  pet_id: string
  event_type: 'VACCINATION' | 'DEWORMING' | 'GROOMING' | 'CHECKUP' | 'OTHER'
  event_name: string
  date_completed: string
  next_due_date?: string
  service_provider?: string
  location?: string
  cost?: number
  notes?: string
  created_at: string
  updated_at: string
  created_from_todo_id?: string
}

interface EventDetailClientProps {
  petId: string
  eventId: string
}

export function EventDetailClient({ petId, eventId }: EventDetailClientProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch event details
  const fetchEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const eventData = await getEvent(eventId)
      setEvent(eventData)
    } catch (error) {
      console.error('获取事件详情失败:', error)
      setError('加载事件详情失败')
      toast.error('加载事件详情失败')
    } finally {
      setLoading(false)
    }
  }

  // Handle event deletion
  const handleDeleteEvent = async () => {
    try {
      const result = await deleteEvent(eventId)
      if (result.success) {
        toast.success('事件已删除')
        router.push(`/dashboard/pets/${petId}/events`)
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除事件失败:', error)
      toast.error('删除失败')
    }
    setShowDeleteDialog(false)
  }

  // Handle successful event update
  const handleEventUpdate = () => {
    fetchEvent() // Refresh the event data
    setShowEditDialog(false)
    toast.success('事件已更新')
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  // Get next due date status
  const getNextDueStatus = (nextDueDate?: string) => {
    if (!nextDueDate) return null
    
    const dueDate = new Date(nextDueDate)
    const today = new Date()
    const threeDaysFromNow = addDays(today, 3)
    
    if (isBefore(dueDate, today)) {
      return { 
        status: 'overdue', 
        label: '已过期', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle
      }
    } else if (isBefore(dueDate, threeDaysFromNow)) {
      return { 
        status: 'upcoming', 
        label: '即将到期', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      }
    } else {
      return { 
        status: 'future', 
        label: '未来', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Calendar
      }
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 EEEE', { locale: zhCN })
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !event) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 text-center mb-6">{error || '事件不存在或无权访问'}</p>
          <Button onClick={() => router.back()} variant="outline">
            返回
          </Button>
        </CardContent>
      </Card>
    )
  }

  const config = EVENT_TYPE_CONFIG[event.event_type]
  const nextDueStatus = getNextDueStatus(event.next_due_date)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">护理记录详情</h1>
            <p className="text-sm text-gray-600">查看和管理护理事件的详细信息</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>编辑</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>删除</span>
          </Button>
        </div>
      </div>

      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{config.icon}</div>
            <div className="flex-1">
              <CardTitle className="text-xl">{event.event_name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className={`${config.color} border-current`}>
                  {config.label}
                </Badge>
                {event.created_from_todo_id && (
                  <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                    来自AI任务
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                <span>完成日期</span>
              </div>
              <p className="text-lg">{formatDate(event.date_completed)}</p>
            </div>

            {event.next_due_date && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>下次到期</span>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-lg">{formatDate(event.next_due_date)}</p>
                  {nextDueStatus && (
                    <Badge 
                      variant="outline" 
                      className={`${nextDueStatus.color} border-current`}
                    >
                      <nextDueStatus.icon className="h-3 w-3 mr-1" />
                      {nextDueStatus.label}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Location and Provider Information */}
          {(event.location || event.service_provider) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.service_provider && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Building className="h-4 w-4" />
                      <span>服务提供商</span>
                    </div>
                    <p className="text-gray-900">{event.service_provider}</p>
                  </div>
                )}

                {event.location && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <MapPin className="h-4 w-4" />
                      <span>地点</span>
                    </div>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Cost Information */}
          {event.cost && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  <span>费用</span>
                </div>
                <p className="text-2xl font-semibold text-green-600">
                  ¥{event.cost.toFixed(2)}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                <span>备注</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{event.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">创建时间：</span>
              {formatDateTime(event.created_at)}
            </div>
            <div>
              <span className="font-medium">更新时间：</span>
              {formatDateTime(event.updated_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showEditDialog && (
        <EventEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          event={event}
          onSuccess={handleEventUpdate}
        />
      )}

      <EventDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteEvent}
      />
    </div>
  )
}