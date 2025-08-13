import { EventsService } from '../events-service'
import { Event } from '@/types/event'

describe('EventsService', () => {
  let service: EventsService

  beforeEach(() => {
    service = new EventsService()
  })

  describe('getUpcomingEventForPet', () => {
    it('returns null when petId is missing', async () => {
      const result = await service.getUpcomingEventForPet('', 'user-123')
      expect(result).toBeNull()
    })

    it('returns null when userId is missing', async () => {
      const result = await service.getUpcomingEventForPet('pet-123', '')
      expect(result).toBeNull()
    })

    it('returns the next upcoming event for a pet', async () => {
      const result = await service.getUpcomingEventForPet('pet-123', 'user-123')
      
      expect(result).not.toBeNull()
      expect(result?.pet_id).toBe('pet-123')
      expect(result?.user_id).toBe('user-123')
      expect(result?.status).toBe('pending')
      expect(result?.title).toBeTruthy()
      expect(result?.due_date).toBeTruthy()
    })

    it('returns events sorted by due date', async () => {
      const result = await service.getUpcomingEventForPet('pet-123', 'user-123')
      
      // The service should return the event with the earliest due date
      expect(result).not.toBeNull()
      if (result) {
        // Get all events to compare
        const allEvents = await service.getEventsForPet('pet-123', 'user-123')
        const pendingEvents = allEvents.filter(e => e.status === 'pending')
        const sortedEvents = pendingEvents.sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        
        expect(result.id).toBe(sortedEvents[0].id)
      }
    })

    it('only returns pending events', async () => {
      const result = await service.getUpcomingEventForPet('pet-123', 'user-123')
      
      if (result) {
        expect(result.status).toBe('pending')
      }
    })
  })

  describe('getEventsForPet', () => {
    it('returns empty array when petId is missing', async () => {
      const result = await service.getEventsForPet('', 'user-123')
      expect(result).toEqual([])
    })

    it('returns empty array when userId is missing', async () => {
      const result = await service.getEventsForPet('pet-123', '')
      expect(result).toEqual([])
    })

    it('returns all events for a pet', async () => {
      const result = await service.getEventsForPet('pet-123', 'user-123')
      
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      result.forEach(event => {
        expect(event.pet_id).toBe('pet-123')
        expect(event.user_id).toBe('user-123')
        expect(event.id).toBeTruthy()
        expect(event.title).toBeTruthy()
        expect(event.due_date).toBeTruthy()
        expect(event.status).toMatch(/^(pending|completed|cancelled)$/)
      })
    })

    it('includes both pending and completed events', async () => {
      const result = await service.getEventsForPet('pet-123', 'user-123')
      
      const statuses = result.map(e => e.status)
      expect(statuses).toContain('pending')
      expect(statuses).toContain('completed')
    })
  })

  describe('createEvent', () => {
    it('creates a new event with generated id and timestamp', async () => {
      const newEvent: Omit<Event, 'id' | 'created_at'> = {
        user_id: 'user-123',
        pet_id: 'pet-123',
        title: 'Test Event',
        due_date: new Date().toISOString(),
        status: 'pending',
        source: 'user'
      }

      const result = await service.createEvent(newEvent)
      
      expect(result.id).toBeTruthy()
      expect(result.created_at).toBeTruthy()
      expect(result.title).toBe(newEvent.title)
      expect(result.pet_id).toBe(newEvent.pet_id)
      expect(result.user_id).toBe(newEvent.user_id)
      expect(result.status).toBe(newEvent.status)
    })
  })

  describe('updateEvent', () => {
    it('returns null for non-existent event', async () => {
      const result = await service.updateEvent('non-existent-id', { status: 'completed' })
      expect(result).toBeNull()
    })

    it('updates an existing event', async () => {
      const updates = {
        status: 'completed' as const,
        pet_id: 'pet-123',
        user_id: 'user-123'
      }

      const result = await service.updateEvent('1', updates)
      
      expect(result).not.toBeNull()
      if (result) {
        expect(result.status).toBe('completed')
        expect(result.pet_id).toBe('pet-123')
        expect(result.user_id).toBe('user-123')
      }
    })
  })

  describe('async behavior', () => {
    it('simulates async delay', async () => {
      const startTime = Date.now()
      await service.getUpcomingEventForPet('pet-123', 'user-123')
      const endTime = Date.now()
      
      // Should take at least 500ms due to setTimeout
      expect(endTime - startTime).toBeGreaterThanOrEqual(500)
    })
  })
})