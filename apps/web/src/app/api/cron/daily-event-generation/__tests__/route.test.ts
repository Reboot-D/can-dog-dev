import { POST, GET } from '../route'
import { createServiceClient } from '@/lib/supabase/server'
import { AutomatedEventService } from '@/lib/events/automated-event-service'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/events/automated-event-service')

const mockSupabase = {
  from: jest.fn()
}

const mockCreateServiceClient = createServiceClient as jest.MockedFunction<typeof createServiceClient>
const mockAutomatedEventService = AutomatedEventService as jest.MockedClass<typeof AutomatedEventService>

describe('/api/cron/daily-event-generation', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any
  let mockGenerateEventsForPet: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateServiceClient.mockReturnValue(mockSupabase as any)
    
    mockGenerateEventsForPet = jest.fn()
    mockAutomatedEventService.prototype.generateEventsForPet = mockGenerateEventsForPet

    mockRequest = {
      headers: {
        get: jest.fn(),
        entries: jest.fn(() => [])
      }
    }
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  describe('Authentication Tests', () => {
    test('should reject request without x-vercel-cron header', async () => {
      mockRequest.headers.get.mockReturnValue(null)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.reason).toBe('Missing or invalid x-vercel-cron header')
    })

    test('should reject request with invalid x-vercel-cron header', async () => {
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return 'invalid'
        return null
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.reason).toBe('Missing or invalid x-vercel-cron header')
    })

    test('should accept request with valid x-vercel-cron header when no CRON_SECRET', async () => {
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(200)
    })

    test('should reject request without authorization when CRON_SECRET is set', async () => {
      process.env.CRON_SECRET = 'test-secret'
      
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.reason).toBe('Invalid or missing authorization token')
    })

    test('should accept request with valid authorization when CRON_SECRET is set', async () => {
      process.env.CRON_SECRET = 'test-secret'
      
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        if (header === 'authorization') return 'Bearer test-secret'
        return null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const response = await POST(mockRequest)
      expect(response.status).toBe(200)
    })
  })

  describe('Database Operation Tests', () => {
    beforeEach(() => {
      // Setup valid headers for all tests
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })
    })

    test('should handle database error when fetching pets', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0].error).toContain('Failed to fetch pets')
    })

    test('should handle empty pets list successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalPets).toBe(0)
      expect(data.processedPets).toBe(0)
    })
  })

  describe('Event Generation Tests', () => {
    beforeEach(() => {
      // Setup valid headers
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })
    })

    test('should process single pet successfully', async () => {
      const mockPets = [{
        id: 'pet-1',
        user_id: 'user-1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        date_of_birth: '2022-01-01'
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPets,
            error: null
          })
        })
      })

      mockGenerateEventsForPet.mockResolvedValue({
        created: 3,
        skipped: 1,
        errors: []
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalPets).toBe(1)
      expect(data.processedPets).toBe(1)
      expect(data.totalEventsCreated).toBe(3)
      expect(data.totalEventsSkipped).toBe(1)
      expect(data.failedPets).toBe(0)
      expect(mockGenerateEventsForPet).toHaveBeenCalledWith('pet-1')
    })

    test('should process multiple pets successfully', async () => {
      const mockPets = [
        { id: 'pet-1', user_id: 'user-1', name: 'Buddy', breed: 'Golden Retriever', date_of_birth: '2022-01-01' },
        { id: 'pet-2', user_id: 'user-2', name: 'Max', breed: 'German Shepherd', date_of_birth: '2021-06-15' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPets,
            error: null
          })
        })
      })

      mockGenerateEventsForPet
        .mockResolvedValueOnce({ created: 2, skipped: 0, errors: [] })
        .mockResolvedValueOnce({ created: 1, skipped: 2, errors: [] })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.totalPets).toBe(2)
      expect(data.processedPets).toBe(2)
      expect(data.totalEventsCreated).toBe(3)
      expect(data.totalEventsSkipped).toBe(2)
      expect(data.failedPets).toBe(0)
    })

    test('should handle individual pet processing errors gracefully', async () => {
      const mockPets = [
        { id: 'pet-1', user_id: 'user-1', name: 'Buddy', breed: 'Golden Retriever', date_of_birth: '2022-01-01' },
        { id: 'pet-2', user_id: 'user-2', name: 'Max', breed: 'German Shepherd', date_of_birth: '2021-06-15' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPets,
            error: null
          })
        })
      })

      mockGenerateEventsForPet
        .mockResolvedValueOnce({ created: 2, skipped: 0, errors: [] })
        .mockResolvedValueOnce({ created: 0, skipped: 0, errors: ['Pet age calculation failed'] })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(207) // Multi-Status for partial success
      expect(data.success).toBe(true) // Still success since some pets processed
      expect(data.totalPets).toBe(2)
      expect(data.processedPets).toBe(2)
      expect(data.totalEventsCreated).toBe(2)
      expect(data.failedPets).toBe(1)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0].petId).toBe('pet-2')
    })

    test('should handle complete processing failure', async () => {
      const mockPets = [
        { id: 'pet-1', user_id: 'user-1', name: 'Buddy', breed: 'Golden Retriever', date_of_birth: '2022-01-01' }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPets,
            error: null
          })
        })
      })

      mockGenerateEventsForPet.mockRejectedValue(new Error('Service unavailable'))

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.failedPets).toBe(1)
      expect(data.errors[0].error).toBe('Service unavailable')
    })
  })

  describe('Logging and Response Tests', () => {
    test('should include execution time in response', async () => {
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.executionTimeMs).toBeGreaterThanOrEqual(0)
      expect(typeof data.executionTimeMs).toBe('number')
    })

    test('should include timestamp in response', async () => {
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('HTTP Method Tests', () => {
    test('should reject GET requests', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed. This endpoint only accepts POST requests.')
    })
  })

  describe('Error Handling Tests', () => {
    test('should handle unexpected errors gracefully', async () => {
      mockRequest.headers.get.mockImplementation((header: string) => {
        if (header === 'x-vercel-cron') return '1'
        return null
      })

      mockCreateServiceClient.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0].error).toBe('Database connection failed')
    })
  })
})