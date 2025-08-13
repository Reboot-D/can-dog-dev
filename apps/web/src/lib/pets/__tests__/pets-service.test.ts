/**
 * Integration tests for PetsService update and delete operations
 * These tests focus on the service layer integration with Supabase
 */

import { Pet, PetUpdate } from '@/types/supabase'

// Mock the Supabase client creation
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}))

import { createClient } from '@/lib/supabase/client'
import { PetsService } from '../pets-service'

describe('PetsService - Update and Delete Operations', () => {
  let petsService: PetsService
  let mockSupabaseClient: ReturnType<typeof createClient>

  const mockPet: Pet = {
    id: 'pet-1',
    name: '小白',
    breed: '金毛',
    date_of_birth: '2022-01-01',
    user_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    photo_url: null
  }

  beforeEach(() => {
    // Create fresh mock chain for each test
    const mockValidationChain = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn()
    }

    const mockUpdateChain = {
      update: jest.fn(),
      eq: jest.fn(),
      select: jest.fn(),
      single: jest.fn()
    }

    const mockDeleteChain = {
      delete: jest.fn(),
      eq: jest.fn()
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
    mockValidationChain.select.mockReturnValue(mockValidationChain)
    mockValidationChain.eq.mockReturnValue(mockValidationChain)
    
    mockUpdateChain.update.mockReturnValue(mockUpdateChain)
    mockUpdateChain.eq.mockReturnValue(mockUpdateChain)
    mockUpdateChain.select.mockReturnValue(mockUpdateChain)
    
    mockDeleteChain.delete.mockReturnValue(mockDeleteChain)

    // Mock the client creation
    const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
    mockCreateClient.mockReturnValue(mockSupabaseClient)

    // Create a new instance for each test
    petsService = new PetsService()
    
    // Store chain references for easy access in tests
    mockSupabaseClient._validationChain = mockValidationChain
    mockSupabaseClient._updateChain = mockUpdateChain
    mockSupabaseClient._deleteChain = mockDeleteChain
  })

  describe('updatePet', () => {
    it('should successfully update a pet', async () => {
      const updateData: Partial<PetUpdate> = {
        name: '小黑',
        breed: '哈士奇'
      }

      const updatedPet = { ...mockPet, ...updateData }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain) // For validation
        .mockReturnValueOnce(mockSupabaseClient._updateChain)     // For update

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: updatedPet,
        error: null
      })

      const result = await petsService.updatePet('pet-1', updateData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pets')
      expect(mockSupabaseClient._updateChain.update).toHaveBeenCalledWith(updateData)
      expect(mockSupabaseClient._updateChain.eq).toHaveBeenCalledWith('id', 'pet-1')
      expect(mockSupabaseClient._updateChain.select).toHaveBeenCalled()
      expect(mockSupabaseClient._updateChain.single).toHaveBeenCalled()
      expect(result).toEqual(updatedPet)
    })

    it('should handle partial updates correctly', async () => {
      const updateData: Partial<PetUpdate> = {
        name: '小黑'
      }

      const updatedPet = { ...mockPet, name: '小黑' }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: updatedPet,
        error: null
      })

      const result = await petsService.updatePet('pet-1', updateData)

      expect(mockSupabaseClient._updateChain.update).toHaveBeenCalledWith({ name: '小黑' })
      expect(result).toEqual(updatedPet)
    })

    it('should handle null values correctly', async () => {
      const updateData: Partial<PetUpdate> = {
        breed: null,
        date_of_birth: null
      }

      const updatedPet = { ...mockPet, breed: null, date_of_birth: null }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: updatedPet,
        error: null
      })

      const result = await petsService.updatePet('pet-1', updateData)

      expect(mockSupabaseClient._updateChain.update).toHaveBeenCalledWith({
        breed: null,
        date_of_birth: null
      })
      expect(result).toEqual(updatedPet)
    })

    it('should throw error when update fails', async () => {
      const updateData: Partial<PetUpdate> = { name: '小黑' }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain failure
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: '42501' }
      })

      await expect(petsService.updatePet('pet-1', updateData)).rejects.toThrow(
        'Failed to update pet: Update failed'
      )
    })

    it('should handle network errors', async () => {
      const updateData: Partial<PetUpdate> = { name: '小黑' }

      // Mock the from() calls
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._validationChain)

      // Mock network error during ownership validation
      mockSupabaseClient._validationChain.single.mockRejectedValue(new Error('Network error'))

      await expect(petsService.updatePet('pet-1', updateData)).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle empty update data', async () => {
      const updateData: Partial<PetUpdate> = {}

      const updatedPet = mockPet

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: updatedPet,
        error: null
      })

      const result = await petsService.updatePet('pet-1', updateData)

      expect(mockSupabaseClient._updateChain.update).toHaveBeenCalledWith({})
      expect(result).toEqual(updatedPet)
    })

    it('should handle constraint violation errors', async () => {
      const updateData: Partial<PetUpdate> = { name: 'Existing Pet Name' }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain constraint violation
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: null,
        error: { 
          message: 'duplicate key value violates unique constraint',
          code: '23505'
        }
      })

      await expect(petsService.updatePet('pet-1', updateData)).rejects.toThrow(
        'You already have a pet with this name'
      )
    })

    it('should handle row not found errors', async () => {
      const updateData: Partial<PetUpdate> = { name: '小黑' }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain row not found
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: null,
        error: { 
          message: 'No rows found',
          code: 'PGRST116'
        }
      })

      await expect(petsService.updatePet('pet-1', updateData)).rejects.toThrow(
        'Failed to update pet: No rows found'
      )
    })

    it('should handle unauthorized access', async () => {
      const updateData: Partial<PetUpdate> = { name: '小黑' }

      // Mock the from() calls
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._validationChain)

      // Mock ownership validation returning different user
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'other-user' },
        error: null
      })

      await expect(petsService.updatePet('pet-1', updateData)).rejects.toThrow(
        'Unauthorized: You can only modify your own pets'
      )
    })

    it('should handle pet not found during validation', async () => {
      const updateData: Partial<PetUpdate> = { name: '小黑' }

      // Mock the from() calls
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._validationChain)

      // Mock ownership validation returning pet not found
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      await expect(petsService.updatePet('pet-1', updateData)).rejects.toThrow(
        'Pet not found'
      )
    })
  })

  describe('deletePet', () => {
    it('should successfully delete a pet', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._deleteChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock delete chain
      mockSupabaseClient._deleteChain.eq.mockResolvedValue({
        data: null,
        error: null
      })

      await petsService.deletePet('pet-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pets')
      expect(mockSupabaseClient._deleteChain.delete).toHaveBeenCalled()
      expect(mockSupabaseClient._deleteChain.eq).toHaveBeenCalledWith('id', 'pet-1')
    })

    it('should throw error when delete fails', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._deleteChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock delete chain failure
      mockSupabaseClient._deleteChain.eq.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed', code: '42501' }
      })

      await expect(petsService.deletePet('pet-1')).rejects.toThrow(
        'Failed to delete pet: Delete failed'
      )
    })

    it('should handle network errors during delete', async () => {
      // Mock the from() calls
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._validationChain)

      // Mock network error during ownership validation
      mockSupabaseClient._validationChain.single.mockRejectedValue(new Error('Network error'))

      await expect(petsService.deletePet('pet-1')).rejects.toThrow('Network error')
    })

    it('should handle permission errors', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._deleteChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock delete chain permission error
      mockSupabaseClient._deleteChain.eq.mockResolvedValue({
        data: null,
        error: { 
          message: 'permission denied for table pets',
          code: '42501'
        }
      })

      await expect(petsService.deletePet('pet-1')).rejects.toThrow(
        'Failed to delete pet: permission denied for table pets'
      )
    })

    it('should handle deleting non-existent pet', async () => {
      // Mock the from() calls
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._validationChain)

      // Mock ownership validation failing (pet not found)
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      await expect(petsService.deletePet('non-existent-pet')).rejects.toThrow('Pet not found')
    })

    it('should handle foreign key constraint violations', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._deleteChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock delete chain foreign key constraint violation
      mockSupabaseClient._deleteChain.eq.mockResolvedValue({
        data: null,
        error: { 
          message: 'update or delete on table "pets" violates foreign key constraint',
          code: '23503'
        }
      })

      await expect(petsService.deletePet('pet-1')).rejects.toThrow(
        'Failed to delete pet: update or delete on table "pets" violates foreign key constraint'
      )
    })

    it('should handle unauthorized access during delete', async () => {
      // Mock the from() calls
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient._validationChain)

      // Mock ownership validation returning different user
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'other-user' },
        error: null
      })

      await expect(petsService.deletePet('pet-1')).rejects.toThrow(
        'Unauthorized: You can only modify your own pets'
      )
    })

    it('should handle successful delete even when no rows affected', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._deleteChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock delete chain success with no rows affected
      mockSupabaseClient._deleteChain.eq.mockResolvedValue({
        data: null,
        error: null
      })

      // Should not throw error
      await expect(petsService.deletePet('pet-1')).resolves.toBeUndefined()
    })
  })

  describe('Error Handling Integration', () => {
    it('should provide consistent error messages for update operations', async () => {
      const scenarios = [
        {
          error: { message: 'Connection timeout', code: '08006' },
          expectedMessage: 'Failed to update pet: Connection timeout'
        },
        {
          error: { message: 'Invalid input syntax', code: '22P02' },
          expectedMessage: 'Failed to update pet: Invalid input syntax'
        },
        {
          error: { message: 'Server error', code: '50000' },
          expectedMessage: 'Failed to update pet: Server error'
        }
      ]

      for (const scenario of scenarios) {
        // Mock the from() calls to return different chains
        mockSupabaseClient.from
          .mockReturnValueOnce(mockSupabaseClient._validationChain)
          .mockReturnValueOnce(mockSupabaseClient._updateChain)

        // Mock validation chain
        mockSupabaseClient._validationChain.single.mockResolvedValue({
          data: { user_id: 'user-123' },
          error: null
        })

        // Mock update chain error
        mockSupabaseClient._updateChain.single.mockResolvedValue({
          data: null,
          error: scenario.error
        })

        await expect(petsService.updatePet('pet-1', { name: 'Test' }))
          .rejects.toThrow(scenario.expectedMessage)
      }
    })

    it('should provide consistent error messages for delete operations', async () => {
      const scenarios = [
        {
          error: { message: 'Connection timeout', code: '08006' },
          expectedMessage: 'Failed to delete pet: Connection timeout'
        },
        {
          error: { message: 'Transaction rollback', code: '40001' },
          expectedMessage: 'Failed to delete pet: Transaction rollback'
        }
      ]

      for (const scenario of scenarios) {
        // Mock the from() calls to return different chains
        mockSupabaseClient.from
          .mockReturnValueOnce(mockSupabaseClient._validationChain)
          .mockReturnValueOnce(mockSupabaseClient._deleteChain)

        // Mock validation chain
        mockSupabaseClient._validationChain.single.mockResolvedValue({
          data: { user_id: 'user-123' },
          error: null
        })

        // Mock delete chain error
        mockSupabaseClient._deleteChain.eq.mockResolvedValue({
          data: null,
          error: scenario.error
        })

        await expect(petsService.deletePet('pet-1'))
          .rejects.toThrow(scenario.expectedMessage)
      }
    })
  })

  describe('Data Validation Integration', () => {
    it('should handle different data types in update operations', async () => {
      const testCases = [
        {
          updateData: { name: '', breed: '', date_of_birth: '' },
          description: 'empty strings'
        },
        {
          updateData: { name: '   ', breed: '   ', date_of_birth: null },
          description: 'whitespace and null'
        },
        {
          updateData: { 
            name: 'A'.repeat(200), 
            breed: 'B'.repeat(200),
            date_of_birth: '2025-12-31'
          },
          description: 'long strings and future date'
        }
      ]

      for (const testCase of testCases) {
        const updatedPet = { ...mockPet, ...testCase.updateData }
        
        // Mock the from() calls to return different chains
        mockSupabaseClient.from
          .mockReturnValueOnce(mockSupabaseClient._validationChain)
          .mockReturnValueOnce(mockSupabaseClient._updateChain)

        // Mock validation chain
        mockSupabaseClient._validationChain.single.mockResolvedValue({
          data: { user_id: 'user-123' },
          error: null
        })

        // Mock update chain
        mockSupabaseClient._updateChain.single.mockResolvedValue({
          data: updatedPet,
          error: null
        })

        const result = await petsService.updatePet('pet-1', testCase.updateData)

        expect(mockSupabaseClient._updateChain.update).toHaveBeenCalledWith(testCase.updateData)
        expect(result).toEqual(updatedPet)
      }
    })
  })

  describe('Service Method Integration', () => {
    it('should properly chain Supabase operations for update', async () => {
      const updateData = { name: '小黑' }
      const updatedPet = { ...mockPet, name: '小黑' }

      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._updateChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock update chain
      mockSupabaseClient._updateChain.single.mockResolvedValue({
        data: updatedPet,
        error: null
      })

      const result = await petsService.updatePet('pet-1', updateData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pets')
      expect(mockSupabaseClient._updateChain.update).toHaveBeenCalledWith(updateData)
      expect(mockSupabaseClient._updateChain.eq).toHaveBeenCalledWith('id', 'pet-1')
      expect(mockSupabaseClient._updateChain.select).toHaveBeenCalled()
      expect(mockSupabaseClient._updateChain.single).toHaveBeenCalled()
      expect(result).toEqual(updatedPet)
    })

    it('should properly chain Supabase operations for delete', async () => {
      // Mock the from() calls to return different chains
      mockSupabaseClient.from
        .mockReturnValueOnce(mockSupabaseClient._validationChain)
        .mockReturnValueOnce(mockSupabaseClient._deleteChain)

      // Mock validation chain
      mockSupabaseClient._validationChain.single.mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null
      })

      // Mock delete chain
      mockSupabaseClient._deleteChain.eq.mockResolvedValue({
        data: null,
        error: null
      })

      await petsService.deletePet('pet-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pets')
      expect(mockSupabaseClient._deleteChain.delete).toHaveBeenCalled()
      expect(mockSupabaseClient._deleteChain.eq).toHaveBeenCalledWith('id', 'pet-1')
    })
  })
})