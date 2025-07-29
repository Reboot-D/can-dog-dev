// Epic 004: Event Tracking System - Events Client Component
// Task 004-02-01: 创建事件列表组件

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { EventList } from '@/components/events/event-list'
import { EventFilters } from '@/components/events/event-filters'
import { EventCreateDialog } from '@/components/events/event-create-dialog'
import { EventDeleteDialog } from '@/components/events/event-delete-dialog'
import { EventEditDialog } from '@/components/events/event-edit-dialog'
import { getEventsByPet, deleteEvent } from './actions'
import type { EventFilters as EventFiltersType } from '@/lib/validations/event'

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
}

interface EventsResponse {
  events: Event[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface EventsClientProps {
  petId: string
  initialFilters: EventFiltersType
}

export function EventsClient({ petId, initialFilters }: EventsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<EventFiltersType>(initialFilters)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  // Fetch events from server
  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response: EventsResponse = await getEventsByPet(petId, filters)
      setEvents(response.events)
      setPagination(response.pagination)
    } catch (error) {
      console.error('获取事件列表失败:', error)
      toast.error('加载事件历史失败')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Update URL when filters change
  const updateURL = (newFilters: EventFiltersType) => {
    const params = new URLSearchParams()
    if (newFilters.type) params.set('type', newFilters.type)
    if (newFilters.start_date) params.set('start_date', newFilters.start_date)
    if (newFilters.end_date) params.set('end_date', newFilters.end_date)
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString())
    
    const newURL = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/dashboard/pets/${petId}/events${newURL}`)
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<EventFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 } // Reset to page 1 when filtering
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }

  // Handle page changes
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }

  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const result = await deleteEvent(eventId)
      if (result.success) {
        toast.success('事件已删除')
        fetchEvents() // Refresh the list
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除事件失败:', error)
      toast.error('删除失败')
    }
    setDeletingEventId(null)
  }

  // Handle successful event creation/update
  const handleEventChange = () => {
    fetchEvents() // Refresh the list
    setShowCreateDialog(false)
    setEditingEvent(null)
  }

  // Fetch events when filters change
  useEffect(() => {
    fetchEvents()
  }, [filters])

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
            <h1 className="text-2xl font-bold text-gray-900">护理记录</h1>
            <p className="text-sm text-gray-600">查看和管理宠物的护理历史</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>添加记录</span>
        </Button>
      </div>

      {/* Filters */}
      <EventFilters 
        filters={filters} 
        onChange={handleFiltersChange}
      />

      {/* Event List */}
      <EventList
        events={events}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={setEditingEvent}
        onDelete={setDeletingEventId}
      />

      {/* Dialogs */}
      <EventCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        petId={petId}
        onSuccess={handleEventChange}
      />

      {editingEvent && (
        <EventEditDialog
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          event={editingEvent}
          onSuccess={handleEventChange}
        />
      )}

      {deletingEventId && (
        <EventDeleteDialog
          open={!!deletingEventId}
          onOpenChange={(open) => !open && setDeletingEventId(null)}
          onConfirm={() => handleDeleteEvent(deletingEventId)}
        />
      )}
    </div>
  )
}