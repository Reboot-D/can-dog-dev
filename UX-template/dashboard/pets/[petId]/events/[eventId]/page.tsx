// Epic 004: Event Tracking System - Event Detail Page
// Task 004-02-02: 实现事件详情页面

import { Suspense } from 'react'
import { EventDetailClient } from './event-detail-client'
import { EventDetailSkeleton } from '@/components/events/event-detail-skeleton'

interface EventDetailPageProps {
  params: Promise<{
    petId: string
    eventId: string
  }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { petId, eventId } = await params
  
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailClient 
          petId={petId}
          eventId={eventId}
        />
      </Suspense>
    </div>
  )
}