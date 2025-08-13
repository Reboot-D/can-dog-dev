/**
 * Integration tests for journal API endpoints
 * Tests the full API workflow including authentication, validation, and database operations
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import { createClient } from '@/lib/supabase/server'
import { clearRateLimit } from '@/lib/rate-limit'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      })),
      order: jest.fn()
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/pets/[petId]/journal', () => {
  const validPetId = '123e4567-e89b-12d3-a456-426614174000'
  const invalidPetId = 'invalid-id'
  const mockUserId = 'user-123'
  
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com'
  }

  const mockPet = {
    user_id: mockUserId
  }

  const mockJournalEntry = {
    id: 'journal-1',
    created_at: '2024-01-01T00:00:00Z',
    user_id: mockUserId,
    pet_id: validPetId,
    content: '今天小白很开心',
    ai_advice: null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockRequest = (body?: any) => {
    return {
      json: async () => body || {}
    } as NextRequest
  }

  const createRouteParams = (petId: string) => ({
    params: { petId }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    clearRateLimit() // Clear rate limit storage for each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('POST /api/pets/[petId]/journal', () => {
    it('should create a journal entry successfully', async () => {
      // Mock successful auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock pet ownership verification
      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockSelectChain)
      })

      // Mock successful journal entry creation
      const mockInsertChain = {
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockJournalEntry,
            error: null
          })
        }))
      }

      // Set up the from mock to return different chains for different calls
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn(() => mockSelectChain)
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => mockInsertChain)
        })

      const request = createMockRequest({ content: '今天小白很开心' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.journalEntry).toEqual(mockJournalEntry)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = createMockRequest({ content: '今天小白很开心' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid pet ID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = createMockRequest({ content: '今天小白很开心' })
      const params = createRouteParams(invalidPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid pet ID format')
    })

    it('should return 404 for pet not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Pet not found')
          })
        }))
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockSelectChain)
      })

      const request = createMockRequest({ content: '今天小白很开心' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Pet not found')
    })

    it('should return 403 for unauthorized pet access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'different-user' },
            error: null
          })
        }))
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockSelectChain)
      })

      const request = createMockRequest({ content: '今天小白很开心' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Unauthorized: You can only create journal entries for your own pets')
    })

    it('should return 400 for missing content', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockSelectChain)
      })

      const request = createMockRequest({ content: '' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
      expect(result.details).toBeDefined()
    })

    it('should return 400 for content too long', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockSelectChain)
      })

      const longContent = 'a'.repeat(10001)
      const request = createMockRequest({ content: longContent })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
    })

    it('should return 500 for database error during creation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }

      const mockInsertChain = {
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn(() => mockSelectChain)
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => mockInsertChain)
        })

      const request = createMockRequest({ content: '今天小白很开心' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to create journal entry')
    })

    it('should sanitize content to prevent XSS attacks', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }

      const mockInsertChain = {
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { ...mockJournalEntry, content: '今天小白很开心，玩了球。' },
            error: null
          })
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn(() => mockSelectChain)
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => mockInsertChain)
        })

      // Test with malicious content containing HTML/script tags
      const maliciousContent = '今天小白很开心<script>alert("xss")</script>，玩了球。<img src="x" onerror="alert(1)">'
      const request = createMockRequest({ content: maliciousContent })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(201)
      // Verify that the content was sanitized (HTML tags stripped)
      expect(result.journalEntry.content).toBe('今天小白很开心，玩了球。')
    })

    it('should enforce rate limiting for journal creation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }

      const mockInsertChain = {
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockJournalEntry,
            error: null
          })
        }))
      }

      // Create multiple successful requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        mockSupabase.from
          .mockReturnValueOnce({
            select: jest.fn(() => mockSelectChain)
          })
          .mockReturnValueOnce({
            insert: jest.fn(() => mockInsertChain)
          })

        const request = createMockRequest({ content: `今天小白很开心 ${i}` })
        const params = createRouteParams(validPetId)

        const response = await POST(request, params)
        expect(response.status).toBe(201)
      }

      // The 11th request should be rate limited
      const request = createMockRequest({ content: '第11条日记' })
      const params = createRouteParams(validPetId)

      const response = await POST(request, params)
      const result = await response.json()

      expect(response.status).toBe(429)
      expect(result.error).toBe('Rate limit exceeded')
      expect(result.message).toBe('Too many journal entries created. Please try again later.')
      expect(result.resetTime).toBeDefined()
    })
  })

  describe('GET /api/pets/[petId]/journal', () => {
    const mockJournalEntries = [mockJournalEntry]

    it('should retrieve journal entries successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }

      const mockJournalSelectChain = {
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockJournalEntries,
            error: null
          })
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn(() => mockSelectChain)
        })
        .mockReturnValueOnce({
          select: jest.fn(() => mockJournalSelectChain)
        })

      const request = createMockRequest()
      const params = createRouteParams(validPetId)

      const response = await GET(request, params)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.journalEntries).toEqual(mockJournalEntries)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = createMockRequest()
      const params = createRouteParams(validPetId)

      const response = await GET(request, params)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid pet ID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = createMockRequest()
      const params = createRouteParams(invalidPetId)

      const response = await GET(request, params)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid pet ID format')
    })

    it('should return 500 for database error during fetch', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockPet,
            error: null
          })
        }))
      }

      const mockJournalSelectChain = {
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn(() => mockSelectChain)
        })
        .mockReturnValueOnce({
          select: jest.fn(() => mockJournalSelectChain)
        })

      const request = createMockRequest()
      const params = createRouteParams(validPetId)

      const response = await GET(request, params)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to fetch journal entries')
    })
  })
})