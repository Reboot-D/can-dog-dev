'use client'

import { useState, useEffect } from 'react'
import { Event } from '@/types/event'
import { eventsService } from './events-service'
import { usePetsStore } from '@/stores/pets'
import { useAuthStore } from '@/stores/auth'

export function useUpcomingEvent() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const activePet = usePetsStore((state) => state.activePet)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const fetchUpcomingEvent = async () => {
      if (!activePet || !user) {
        setEvent(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const upcomingEvent = await eventsService.getUpcomingEventForPet(
          activePet.id,
          user.id
        )
        setEvent(upcomingEvent)
      } catch (err) {
        console.error('Failed to fetch upcoming event:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching event'
        setError(errorMessage)
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingEvent()
  }, [activePet, user])

  return { event, loading, error }
}