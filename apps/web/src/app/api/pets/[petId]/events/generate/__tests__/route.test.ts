import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { AutomatedEventService } from '@/lib/events/automated-event-service'
import { rateLimit } from '@/lib/rate-limit'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/events/automated-event-service')
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  JOURNAL_RATE_LIMIT_CONFIG: { windowMs: 60000, maxRequests: 10 }
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>
const mockAutomatedEventService = AutomatedEventService as jest.MockedClass<typeof AutomatedEventService>

describe('POST /api/pets/[petId]/events/generate', () => {
  const mockPetId = '123e4567-e89b-12d3-a456-426614174000'
  const mockUserId = '987e4567-e89b-12d3-a456-426614174000'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any
  let mockGenerateEventsForPet: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockReturnValue(mockSupabase as any)
    mockRateLimit.mockReturnValue({ allowed: true, remainingRequests: 9 })
    
    mockGenerateEventsForPet = jest.fn()
    mockAutomatedEventService.prototype.generateEventsForPet = mockGenerateEventsForPet

    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        get: jest.fn().mockReturnValue(null)
      }
    }
  })

  it('should return 429 when rate limited', async () => {
    mockRateLimit.mockReturnValue({ allowed: false, resetTime: Date.now() + 60000 })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many requests')
  })

  it('should return 401 when user not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 for invalid pet ID format', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    const response = await POST(mockRequest, { params: { petId: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid pet ID format')
  })

  it('should return 404 when pet not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      })
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Pet not found or access denied')
  })

  it('should return 404 when user does not own the pet', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockPetId, user_id: 'different-user-id' },
              error: null
            })
          })
        })
      })
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Pet not found or access denied')
  })

  it('should successfully generate events', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockPetId },
              error: null
            })
          })
        })
      })
    })

    mockGenerateEventsForPet.mockResolvedValue({
      created: 3,
      skipped: 1,
      errors: []
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual({
      success: true,
      created: 3,
      skipped: 1,
      errors: []
    })
    expect(mockGenerateEventsForPet).toHaveBeenCalledWith(mockPetId)
  })

  it('should return 207 for partial success with errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockPetId },
              error: null
            })
          })
        })
      })
    })

    mockGenerateEventsForPet.mockResolvedValue({
      created: 2,
      skipped: 0,
      errors: ['Some error occurred']
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(207)
    expect(data).toEqual({
      success: true,
      created: 2,
      skipped: 0,
      errors: ['Some error occurred']
    })
  })

  it('should handle unexpected errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    mockSupabase.from.mockImplementation(() => {
      throw new Error('Unexpected database error')
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
    expect(data.message).toBe('Unexpected database error')
  })

  it('should return success when only events were skipped', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockPetId },
              error: null
            })
          })
        })
      })
    })

    mockGenerateEventsForPet.mockResolvedValue({
      created: 0,
      skipped: 5,
      errors: []
    })

    const response = await POST(mockRequest, { params: { petId: mockPetId } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual({
      success: true,
      created: 0,
      skipped: 5,
      errors: []
    })
  })
})