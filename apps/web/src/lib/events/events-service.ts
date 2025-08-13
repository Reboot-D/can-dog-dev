import { Event } from '@/types/event'
import { addDays, addHours, addWeeks } from 'date-fns'

// Placeholder event data for development
const placeholderEvents: Omit<Event, 'pet_id' | 'user_id'>[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    title: '疫苗接种 - 狂犬病疫苗',
    due_date: addDays(new Date(), 7).toISOString(),
    status: 'pending',
    source: 'system'
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    title: '兽医复诊',
    due_date: addWeeks(new Date(), 2).toISOString(),
    status: 'pending',
    source: 'user'
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    title: '洗澡美容',
    due_date: addDays(new Date(), 3).toISOString(),
    status: 'pending',
    source: 'user'
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    title: '驱虫药物',
    due_date: addHours(new Date(), -2).toISOString(), // Past event
    status: 'completed',
    source: 'system'
  }
]

export class EventsService {
  // Get upcoming event for a specific pet
  async getUpcomingEventForPet(petId: string, userId: string): Promise<Event | null> {
    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!petId || !userId) {
      return null
    }

    // Filter for pending events and sort by due date
    const upcomingEvents = placeholderEvents
      .filter(event => event.status === 'pending')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    // Return the first upcoming event with pet and user IDs
    if (upcomingEvents.length > 0) {
      return {
        ...upcomingEvents[0],
        pet_id: petId,
        user_id: userId
      }
    }

    return null
  }

  // Get all events for a specific pet
  async getEventsForPet(petId: string, userId: string): Promise<Event[]> {
    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!petId || !userId) {
      return []
    }

    // Return all events with pet and user IDs
    return placeholderEvents.map(event => ({
      ...event,
      pet_id: petId,
      user_id: userId
    }))
  }

  // Create a new event (placeholder implementation)
  async createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 500))

    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }

    // In a real implementation, this would save to the database
    return newEvent
  }

  // Update an event (placeholder implementation)
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 500))

    const event = placeholderEvents.find(e => e.id === eventId)
    if (!event) {
      return null
    }

    // In a real implementation, this would update the database
    return {
      ...event,
      ...updates,
      pet_id: updates.pet_id || '',
      user_id: updates.user_id || ''
    } as Event
  }
}

export const eventsService = new EventsService()