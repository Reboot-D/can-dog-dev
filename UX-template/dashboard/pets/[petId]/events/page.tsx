// Epic 004: Event Tracking System - Event List Page
// Task 004-02-01: 创建事件列表组件

import { Suspense } from 'react'
import { EventsClient } from './events-client'
import { EventListSkeleton } from '@/components/events/event-list-skeleton'

interface EventsPageProps {
  params: Promise<{
    petId: string
  }>
  searchParams: Promise<{
    type?: string
    start_date?: string
    end_date?: string
    page?: string
  }>
}

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
  const { petId } = await params
  const searchParamsResolved = await searchParams
  
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<EventListSkeleton />}>
        <EventsClient 
          petId={petId}
          initialFilters={{
            type: (searchParamsResolved.type as any) || '',
            start_date: searchParamsResolved.start_date || '',
            end_date: searchParamsResolved.end_date || '',
            page: parseInt(searchParamsResolved.page || '1'),
            limit: 20
          }}
        />
      </Suspense>
    </div>
  )
}