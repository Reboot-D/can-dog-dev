import { renderHook, waitFor } from '@testing-library/react'
import { useUpcomingEvent } from '../use-upcoming-event'
import { eventsService } from '../events-service'
import { usePetsStore } from '@/stores/pets'
import { useAuthStore } from '@/stores/auth'

// Mock the services and stores
jest.mock('../events-service')
jest.mock('@/stores/pets')
jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn()
}))

// Mock Supabase client to prevent ESM import issues
jest.mock('@/lib/supabase/client', () => ({
  supabase: {}
}))

const mockEventsService = eventsService as jest.Mocked<typeof eventsService>
const mockUsePetsStore = usePetsStore as unknown as jest.MockedFunction<typeof usePetsStore>
const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<typeof useAuthStore>

describe('useUpcomingEvent', () => {
  const mockPet = {
    id: 'pet-123',
    name: 'Test Pet',
    user_id: 'user-123',
    breed: 'Test Breed',
    date_of_birth: '2023-01-01',
    created_at: '2023-01-01T00:00:00Z'
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockEvent = {
    id: 'event-123',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user-123',
    pet_id: 'pet-123',
    title: 'Test Event',
    due_date: '2024-01-15T00:00:00Z',
    status: 'pending' as const,
    source: 'system'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null event when no active pet', async () => {
    mockUsePetsStore.mockReturnValue(null)
    mockUseAuthStore.mockReturnValue(mockUser)

    const { result } = renderHook(() => useUpcomingEvent())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.event).toBeNull()
    expect(result.current.error).toBeNull()
    expect(mockEventsService.getUpcomingEventForPet).not.toHaveBeenCalled()
  })

  it('returns null event when no user', async () => {
    mockUsePetsStore.mockReturnValue(mockPet)
    mockUseAuthStore.mockReturnValue(null)

    const { result } = renderHook(() => useUpcomingEvent())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.event).toBeNull()
    expect(result.current.error).toBeNull()
    expect(mockEventsService.getUpcomingEventForPet).not.toHaveBeenCalled()
  })

  it('fetches upcoming event when both pet and user are available', async () => {
    mockUsePetsStore.mockReturnValue(mockPet)
    mockUseAuthStore.mockReturnValue(mockUser)
    mockEventsService.getUpcomingEventForPet.mockResolvedValue(mockEvent)

    const { result } = renderHook(() => useUpcomingEvent())

    // Initially loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.event).toEqual(mockEvent)
    expect(result.current.error).toBeNull()
    expect(mockEventsService.getUpcomingEventForPet).toHaveBeenCalledWith(
      'pet-123',
      'user-123'
    )
  })

  it('handles error when fetching event fails', async () => {
    mockUsePetsStore.mockReturnValue(mockPet)
    mockUseAuthStore.mockReturnValue(mockUser)
    mockEventsService.getUpcomingEventForPet.mockRejectedValue(
      new Error('Failed to fetch')
    )

    const { result } = renderHook(() => useUpcomingEvent())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.event).toBeNull()
    expect(result.current.error).toBe('Failed to fetch')
  })

  it('refetches event when active pet changes', async () => {
    const mockPet2 = { ...mockPet, id: 'pet-456', name: 'Pet 2' }
    
    // Initial render with first pet
    mockUsePetsStore.mockReturnValue(mockPet)
    mockUseAuthStore.mockReturnValue(mockUser)
    mockEventsService.getUpcomingEventForPet.mockResolvedValue(mockEvent)

    const { result, rerender } = renderHook(() => useUpcomingEvent())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockEventsService.getUpcomingEventForPet).toHaveBeenCalledTimes(1)
    expect(mockEventsService.getUpcomingEventForPet).toHaveBeenCalledWith(
      'pet-123',
      'user-123'
    )

    // Change active pet
    mockUsePetsStore.mockReturnValue(mockPet2)
    const mockEvent2 = { ...mockEvent, pet_id: 'pet-456' }
    mockEventsService.getUpcomingEventForPet.mockResolvedValue(mockEvent2)

    rerender()

    await waitFor(() => {
      expect(result.current.event?.pet_id).toBe('pet-456')
    })

    expect(mockEventsService.getUpcomingEventForPet).toHaveBeenCalledTimes(2)
    expect(mockEventsService.getUpcomingEventForPet).toHaveBeenLastCalledWith(
      'pet-456',
      'user-123'
    )
  })

  it('handles null event response', async () => {
    mockUsePetsStore.mockReturnValue(mockPet)
    mockUseAuthStore.mockReturnValue(mockUser)
    mockEventsService.getUpcomingEventForPet.mockResolvedValue(null)

    const { result } = renderHook(() => useUpcomingEvent())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.event).toBeNull()
    expect(result.current.error).toBeNull()
  })
})