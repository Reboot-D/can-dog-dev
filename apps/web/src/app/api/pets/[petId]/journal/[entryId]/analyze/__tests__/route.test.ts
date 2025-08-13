/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'

// Mock dependencies BEFORE importing the route
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/gemini/gemini-service')

// Import after mocking
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { geminiService } from '@/lib/gemini/gemini-service'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGeminiService = geminiService as jest.Mocked<typeof geminiService>

// Mock Supabase client methods
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
}

// Helper function to create a fresh mock query chain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockQuery = (result: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(), 
  single: jest.fn().mockResolvedValue(result),
  update: jest.fn().mockReturnThis()
})

describe('/api/pets/[petId]/journal/[entryId]/analyze', () => {
  const validPetId = '123e4567-e89b-12d3-a456-426614174000'
  const validEntryId = '123e4567-e89b-12d3-a456-426614174001'
  const validUserId = 'user123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('POST', () => {
    const createRequest = () => {
      return {
        method: 'POST',
        url: 'http://localhost:3000/api/pets/test/journal/test/analyze',
        headers: new Map(),
        json: jest.fn().mockResolvedValue({}),
        nextUrl: {
          searchParams: new URLSearchParams()
        }
      } as unknown as NextRequest
    }

    const createValidMockData = () => {
      // Mock successful authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock supabase.from() calls in sequence
      const petQuery = createMockQuery({
        data: { user_id: validUserId, name: '小白', breed: '金毛寻回犬' },
        error: null
      })
      
      const journalQuery = createMockQuery({
        data: { 
          id: validEntryId, 
          content: '今天小白很活跃', 
          ai_advice: null, 
          pet_id: validPetId 
        },
        error: null
      })

      const updateQuery = createMockQuery({
        data: { 
          id: validEntryId, 
          content: '今天小白很活跃', 
          ai_advice: '根据您的描述，小白今天表现很好...' 
        },
        error: null
      })

      // Mock from() calls in sequence: pets, journal_entries, journal_entries (update)
      mockSupabaseClient.from
        .mockReturnValueOnce(petQuery as any)
        .mockReturnValueOnce(journalQuery as any)
        .mockReturnValueOnce(updateQuery as any)

      // Mock successful AI analysis
      mockGeminiService.analyzeJournalEntry.mockResolvedValue({
        success: true,
        analysis: '根据您的描述，小白今天表现很好...'
      })
    }

    it('should successfully analyze journal entry', async () => {
      createValidMockData()

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.ai_advice).toBe('根据您的描述，小白今天表现很好...')
      expect(responseData.message).toBe('Journal entry analyzed successfully')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid pet ID format', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      const request = createRequest()
      const params = { params: { petId: 'invalid-uuid', entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid pet ID format')
    })

    it('should return 400 for invalid entry ID format', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: 'invalid-uuid' } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid journal entry ID format')
    })

    it('should return 404 for non-existent pet', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock the pet query to return not found
      const mockPetQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Pet not found')
        })
      }
      mockSupabaseClient.from.mockReturnValue(mockPetQuery as any)

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Pet not found')
    })

    it('should return 403 for unauthorized pet access', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock pet query to return pet owned by different user
      const mockPetQuery = createMockQuery({
        data: { user_id: 'other-user', name: '小白', breed: '金毛寻回犬' },
        error: null
      })
      mockSupabaseClient.from.mockReturnValue(mockPetQuery as any)

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Unauthorized: You can only analyze journal entries for your own pets')
    })

    it('should return 404 for non-existent journal entry', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock successful pet query, then failed journal entry query
      const petQuery = createMockQuery({
        data: { user_id: validUserId, name: '小白', breed: '金毛寻回犬' },
        error: null
      })
      
      const journalQuery = createMockQuery({
        data: null,
        error: new Error('Journal entry not found')
      })

      mockSupabaseClient.from
        .mockReturnValueOnce(petQuery as any)
        .mockReturnValueOnce(journalQuery as any)

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Journal entry not found')
    })

    it('should return existing analysis if already exists', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock successful pet query
      const petQuery = createMockQuery({
        data: { user_id: validUserId, name: '小白', breed: '金毛寻回犬' },
        error: null
      })
      
      // Mock journal entry with existing ai_advice
      const journalQuery = createMockQuery({
        data: { 
          id: validEntryId, 
          content: '今天小白很活跃', 
          ai_advice: '现有的AI建议', 
          pet_id: validPetId 
        },
        error: null
      })

      mockSupabaseClient.from
        .mockReturnValueOnce(petQuery as any)
        .mockReturnValueOnce(journalQuery as any)

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.ai_advice).toBe('现有的AI建议')
      expect(responseData.message).toBe('Analysis already exists')
      expect(mockGeminiService.analyzeJournalEntry).not.toHaveBeenCalled()
    })

    it('should handle AI analysis failure', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock successful pet query
      const petQuery = createMockQuery({
        data: { user_id: validUserId, name: '小白', breed: '金毛寻回犬' },
        error: null
      })
      
      // Mock journal entry without ai_advice
      const journalQuery = createMockQuery({
        data: { 
          id: validEntryId, 
          content: '今天小白很活跃', 
          ai_advice: null, 
          pet_id: validPetId 
        },
        error: null
      })

      mockSupabaseClient.from
        .mockReturnValueOnce(petQuery as any)
        .mockReturnValueOnce(journalQuery as any)

      // Mock AI failure
      mockGeminiService.analyzeJournalEntry.mockResolvedValue({
        success: false,
        analysis: '',
        error: 'AI service temporarily unavailable'
      })

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('AI analysis failed')
      expect(responseData.message).toBe('AI service temporarily unavailable')
    })

    it('should handle database update failure', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: validUserId } },
        error: null
      })

      // Mock successful pet query
      const petQuery = createMockQuery({
        data: { user_id: validUserId, name: '小白', breed: '金毛寻回犬' },
        error: null
      })
      
      // Mock successful journal entry query
      const journalQuery = createMockQuery({
        data: { 
          id: validEntryId, 
          content: '今天小白很活跃', 
          ai_advice: null, 
          pet_id: validPetId 
        },
        error: null
      })

      // Mock failed update query
      const failedUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database update failed')
          })
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(petQuery as any)
        .mockReturnValueOnce(journalQuery as any)
        .mockReturnValueOnce(failedUpdateQuery as any)

      // Mock successful AI analysis
      mockGeminiService.analyzeJournalEntry.mockResolvedValue({
        success: true,
        analysis: 'AI分析结果'
      })

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to save AI analysis')
    })

    it('should handle unexpected errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Unexpected error'))

      const request = createRequest()
      const params = { params: { petId: validPetId, entryId: validEntryId } }

      const response = await POST(request, params)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
    })
  })
})