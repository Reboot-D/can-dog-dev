/**
 * Unit tests for JournalService
 * These tests focus on the service layer integration with Supabase
 */

import { JournalEntry } from '@/types/supabase'

// Mock the Supabase client creation
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

import { createClient } from '@/lib/supabase/client'
import { JournalService } from '../journal-service'

describe('JournalService', () => {
  let journalService: JournalService
  let mockSupabaseClient: ReturnType<typeof createClient>

  const mockJournalEntry: JournalEntry = {
    id: 'journal-1',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user-123',
    pet_id: 'pet-456',
    content: '今天小白很开心，玩了很久的球。',
    ai_advice: null
  }

  const mockPet = {
    id: 'pet-456',
    user_id: 'user-123',
    name: '小白'
  }

  beforeEach(() => {
    // Create fresh mock chains for each test
    const mockPetValidationChain = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn()
    }

    const mockJournalInsertChain = {
      insert: jest.fn(),
      select: jest.fn(),
      single: jest.fn()
    }

    const mockJournalSelectChain = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn()
    }

    mockSupabaseClient = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    }

    // Set up chainable mock methods
    mockPetValidationChain.select.mockReturnValue(mockPetValidationChain)
    mockPetValidationChain.eq.mockReturnValue(mockPetValidationChain)
    
    mockJournalInsertChain.insert.mockReturnValue(mockJournalInsertChain)
    mockJournalInsertChain.select.mockReturnValue(mockJournalInsertChain)
    
    mockJournalSelectChain.select.mockReturnValue(mockJournalSelectChain)
    mockJournalSelectChain.eq.mockReturnValue(mockJournalSelectChain)
    mockJournalSelectChain.order.mockReturnValue(mockJournalSelectChain)

    // Mock the client creation
    const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
    mockCreateClient.mockReturnValue(mockSupabaseClient)

    // Create a new instance for each test
    journalService = new JournalService()
    
    // Store chain references for easy access in tests
    mockSupabaseClient._petValidationChain = mockPetValidationChain
    mockSupabaseClient._journalInsertChain = mockJournalInsertChain
    mockSupabaseClient._journalSelectChain = mockJournalSelectChain
  })

  describe('createJournalEntry', () => {
    it('should successfully create a journal entry', async () => {
      const content = '今天小白很开心，玩了很久的球。'

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain) // For pet validation
        .mockReturnValueOnce(mockSupabaseClient._journalInsertChain) // For journal insert

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal insert chain
      mockSupabaseClient._journalInsertChain.single.mockResolvedValue({
        data: mockJournalEntry,
        error: null
      })

      const result = await journalService.createJournalEntry('pet-456', content)

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pets')
      expect(mockSupabaseClient._petValidationChain.select).toHaveBeenCalledWith('user_id')
      expect(mockSupabaseClient._petValidationChain.eq).toHaveBeenCalledWith('id', 'pet-456')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('journal_entries')
      expect(mockSupabaseClient._journalInsertChain.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        pet_id: 'pet-456',
        content: content
      })
      expect(result).toEqual(mockJournalEntry)
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      await expect(journalService.createJournalEntry('pet-456', 'content')).rejects.toThrow(
        'User not authenticated'
      )
    })

    it('should throw error when pet is not found', async () => {
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._petValidationChain)

      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      await expect(journalService.createJournalEntry('non-existent-pet', 'content')).rejects.toThrow(
        'Pet not found'
      )
    })

    it('should throw error when user does not own the pet', async () => {
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._petValidationChain)

      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: { user_id: 'other-user' },
        error: null
      })

      await expect(journalService.createJournalEntry('pet-456', 'content')).rejects.toThrow(
        'Unauthorized: You can only access your own pets'
      )
    })

    it('should throw error when content is empty', async () => {
      await expect(journalService.createJournalEntry('pet-456', '')).rejects.toThrow(
        'Journal entry content cannot be empty'
      )

      await expect(journalService.createJournalEntry('pet-456', '   ')).rejects.toThrow(
        'Journal entry content cannot be empty'
      )
    })

    it('should throw error when content is too long', async () => {
      const longContent = 'a'.repeat(10001)

      await expect(journalService.createJournalEntry('pet-456', longContent)).rejects.toThrow(
        'Journal entry content is too long (maximum 10,000 characters)'
      )
    })

    it('should trim content before saving', async () => {
      const content = '  今天小白很开心，玩了很久的球。  '
      const trimmedContent = '今天小白很开心，玩了很久的球。'

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
        .mockReturnValueOnce(mockSupabaseClient._journalInsertChain)

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal insert chain
      mockSupabaseClient._journalInsertChain.single.mockResolvedValue({
        data: { ...mockJournalEntry, content: trimmedContent },
        error: null
      })

      await journalService.createJournalEntry('pet-456', content)

      expect(mockSupabaseClient._journalInsertChain.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        pet_id: 'pet-456',
        content: trimmedContent
      })
    })

    it('should handle database error during journal entry creation', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
        .mockReturnValueOnce(mockSupabaseClient._journalInsertChain)

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal insert chain failure
      mockSupabaseClient._journalInsertChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '23505' }
      })

      await expect(journalService.createJournalEntry('pet-456', 'content')).rejects.toThrow(
        'Failed to create journal entry: Database error'
      )
    })
  })

  describe('getJournalEntries', () => {
    const mockJournalEntries = [
      mockJournalEntry,
      {
        ...mockJournalEntry,
        id: 'journal-2',
        content: '今天小白睡了一整天。',
        created_at: '2024-01-02T00:00:00Z'
      }
    ]

    it('should successfully retrieve journal entries for a pet', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
        .mockReturnValueOnce(mockSupabaseClient._journalSelectChain)

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal select chain
      mockSupabaseClient._journalSelectChain.order.mockResolvedValue({
        data: mockJournalEntries,
        error: null
      })

      const result = await journalService.getJournalEntries('pet-456')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pets')
      expect(mockSupabaseClient._petValidationChain.select).toHaveBeenCalledWith('user_id')
      expect(mockSupabaseClient._petValidationChain.eq).toHaveBeenCalledWith('id', 'pet-456')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('journal_entries')
      expect(mockSupabaseClient._journalSelectChain.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient._journalSelectChain.eq).toHaveBeenCalledWith('pet_id', 'pet-456')
      expect(mockSupabaseClient._journalSelectChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockJournalEntries)
    })

    it('should return empty array when no journal entries exist', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
        .mockReturnValueOnce(mockSupabaseClient._journalSelectChain)

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal select chain with empty result
      mockSupabaseClient._journalSelectChain.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await journalService.getJournalEntries('pet-456')

      expect(result).toEqual([])
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      await expect(journalService.getJournalEntries('pet-456')).rejects.toThrow(
        'User not authenticated'
      )
    })

    it('should throw error when pet is not found', async () => {
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._petValidationChain)

      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      await expect(journalService.getJournalEntries('non-existent-pet')).rejects.toThrow(
        'Pet not found'
      )
    })

    it('should throw error when user does not own the pet', async () => {
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._petValidationChain)

      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: { user_id: 'other-user' },
        error: null
      })

      await expect(journalService.getJournalEntries('pet-456')).rejects.toThrow(
        'Unauthorized: You can only access your own pets'
      )
    })

    it('should handle database error during journal entry retrieval', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
        .mockReturnValueOnce(mockSupabaseClient._journalSelectChain)

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal select chain failure
      mockSupabaseClient._journalSelectChain.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '42501' }
      })

      await expect(journalService.getJournalEntries('pet-456')).rejects.toThrow(
        'Failed to fetch journal entries: Database error'
      )
    })

    it('should handle null data response gracefully', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
        .mockReturnValueOnce(mockSupabaseClient._journalSelectChain)

      // Mock pet validation chain
      mockSupabaseClient._petValidationChain.single.mockResolvedValue({
        data: mockPet,
        error: null
      })

      // Mock journal select chain with null data
      mockSupabaseClient._journalSelectChain.order.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await journalService.getJournalEntries('pet-456')

      expect(result).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('should provide consistent error messages for authentication failures', async () => {
      const authScenarios = [
        {
          authResponse: { data: { user: null }, error: null },
          expectedMessage: 'User not authenticated'
        },
        {
          authResponse: { data: { user: null }, error: { message: 'Token expired' } },
          expectedMessage: 'User not authenticated'
        },
        {
          authResponse: { data: { user: undefined }, error: { message: 'Invalid token' } },
          expectedMessage: 'User not authenticated'
        }
      ]

      for (const scenario of authScenarios) {
        mockSupabaseClient.auth.getUser.mockResolvedValue(scenario.authResponse)

        await expect(journalService.createJournalEntry('pet-456', 'content'))
          .rejects.toThrow(scenario.expectedMessage)

        await expect(journalService.getJournalEntries('pet-456'))
          .rejects.toThrow(scenario.expectedMessage)
      }
    })

    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'))

      await expect(journalService.createJournalEntry('pet-456', 'content'))
        .rejects.toThrow('Network error')

      await expect(journalService.getJournalEntries('pet-456'))
        .rejects.toThrow('Network error')
    })
  })

  describe('Content Validation', () => {
    it('should handle various content edge cases', async () => {
      const validationCases = [
        { content: null, shouldFail: true, expectedMessage: 'Journal entry content cannot be empty' },
        { content: undefined, shouldFail: true, expectedMessage: 'Journal entry content cannot be empty' },
        { content: '', shouldFail: true, expectedMessage: 'Journal entry content cannot be empty' },
        { content: '   \n\t   ', shouldFail: true, expectedMessage: 'Journal entry content cannot be empty' },
        { content: 'a', shouldFail: false },
        { content: 'a'.repeat(10000), shouldFail: false },
        { content: 'a'.repeat(10001), shouldFail: true, expectedMessage: 'Journal entry content is too long (maximum 10,000 characters)' }
      ]

      for (const testCase of validationCases) {
        if (testCase.shouldFail) {
          await expect(journalService.createJournalEntry('pet-456', testCase.content as string))
            .rejects.toThrow(testCase.expectedMessage)
        } else {
          // Setup mocks for successful cases
          mockSupabaseClient.from
            .mockReturnValueOnce(mockSupabaseClient._petValidationChain)
            .mockReturnValueOnce(mockSupabaseClient._journalInsertChain)

          mockSupabaseClient._petValidationChain.single.mockResolvedValue({
            data: mockPet,
            error: null
          })

          mockSupabaseClient._journalInsertChain.single.mockResolvedValue({
            data: mockJournalEntry,
            error: null
          })

          await expect(journalService.createJournalEntry('pet-456', testCase.content as string))
            .resolves.toBeDefined()
        }
      }
    })
  })
})