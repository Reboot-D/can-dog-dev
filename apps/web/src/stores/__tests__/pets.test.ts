import { renderHook, act } from '@testing-library/react'
import { usePetsStore } from '../pets'
import { Pet } from '@/types/supabase'

// Mock pet data
const mockPet1: Pet = {
  id: 'pet1',
  created_at: '2023-01-01T00:00:00Z',
  user_id: 'user1',
  name: '小白',
  breed: '金毛',
  date_of_birth: '2022-01-01',
  photo_url: null
}

const mockPet2: Pet = {
  id: 'pet2',
  created_at: '2023-01-02T00:00:00Z',
  user_id: 'user1',
  name: '小黑',
  breed: '拉布拉多',
  date_of_birth: '2021-06-15',
  photo_url: null
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('pets store', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => usePetsStore())
    act(() => {
      result.current.reset()
    })
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  describe('initial state', () => {
    it('should have empty pets array and no active pet initially', () => {
      const { result } = renderHook(() => usePetsStore())
      
      expect(result.current.pets).toEqual([])
      expect(result.current.activePet).toBeNull()
    })
  })

  describe('setPets', () => {
    it('should set pets array', () => {
      const { result } = renderHook(() => usePetsStore())
      
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
      })
      
      expect(result.current.pets).toEqual([mockPet1, mockPet2])
    })

    it('should clear active pet if it no longer exists in pets list', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set initial pets and active pet
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Update pets without the active pet
      act(() => {
        result.current.setPets([mockPet2])
      })
      
      expect(result.current.activePet).toBeNull()
    })

    it('should keep active pet if it still exists in pets list', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set initial pets and active pet
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Update pets but keep the active pet
      act(() => {
        result.current.setPets([mockPet1])
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
    })
  })

  describe('setActivePet', () => {
    it('should set active pet when pet exists in pets list', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets first
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
      })
      
      // Set active pet
      act(() => {
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
    })

    it('should not set active pet when pet does not exist in pets list', () => {
      const { result } = renderHook(() => usePetsStore())
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Set up pets list without mockPet1
      act(() => {
        result.current.setPets([mockPet2])
      })
      
      // Try to set mockPet1 as active (not in list)
      act(() => {
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Trying to set active pet that does not exist in pets list')
      
      consoleSpy.mockRestore()
    })

    it('should set active pet to null', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets and active pet
      act(() => {
        result.current.setPets([mockPet1])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Clear active pet
      act(() => {
        result.current.setActivePet(null)
      })
      
      expect(result.current.activePet).toBeNull()
    })
  })

  describe('addPet', () => {
    it('should add pet to pets array', () => {
      const { result } = renderHook(() => usePetsStore())
      
      act(() => {
        result.current.addPet(mockPet1)
      })
      
      expect(result.current.pets).toEqual([mockPet1])
    })

    it('should auto-select first pet as active', () => {
      const { result } = renderHook(() => usePetsStore())
      
      act(() => {
        result.current.addPet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
    })

    it('should not change active pet when adding subsequent pets', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Add first pet
      act(() => {
        result.current.addPet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Add second pet
      act(() => {
        result.current.addPet(mockPet2)
      })
      
      expect(result.current.pets).toEqual([mockPet1, mockPet2])
      expect(result.current.activePet).toEqual(mockPet1) // Should remain the same
    })
  })

  describe('removePet', () => {
    it('should remove pet from pets array', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
      })
      
      // Remove pet
      act(() => {
        result.current.removePet(mockPet1.id)
      })
      
      expect(result.current.pets).toEqual([mockPet2])
    })

    it('should select new active pet when removing current active pet', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets and active pet
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Remove active pet
      act(() => {
        result.current.removePet(mockPet1.id)
      })
      
      expect(result.current.pets).toEqual([mockPet2])
      expect(result.current.activePet).toEqual(mockPet2)
    })

    it('should clear active pet when removing the last pet', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up single pet as active
      act(() => {
        result.current.setPets([mockPet1])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Remove the only pet
      act(() => {
        result.current.removePet(mockPet1.id)
      })
      
      expect(result.current.pets).toEqual([])
      expect(result.current.activePet).toBeNull()
    })

    it('should not change active pet when removing non-active pet', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets and active pet
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Remove non-active pet
      act(() => {
        result.current.removePet(mockPet2.id)
      })
      
      expect(result.current.pets).toEqual([mockPet1])
      expect(result.current.activePet).toEqual(mockPet1) // Should remain the same
    })
  })

  describe('updatePet', () => {
    it('should update pet in pets array', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
      })
      
      // Update pet
      const updates = { name: '小白白', breed: '萨摩耶' }
      act(() => {
        result.current.updatePet(mockPet1.id, updates)
      })
      
      expect(result.current.pets[0]).toEqual({ ...mockPet1, ...updates })
      expect(result.current.pets[1]).toEqual(mockPet2) // Should remain unchanged
    })

    it('should update active pet when it is the one being updated', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets and active pet
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      // Update active pet
      const updates = { name: '小白白' }
      act(() => {
        result.current.updatePet(mockPet1.id, updates)
      })
      
      expect(result.current.activePet).toEqual({ ...mockPet1, ...updates })
    })

    it('should not update active pet when updating non-active pet', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets and active pet
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      // Update non-active pet
      const updates = { name: '小黑黑' }
      act(() => {
        result.current.updatePet(mockPet2.id, updates)
      })
      
      expect(result.current.activePet).toEqual(mockPet1) // Should remain unchanged
    })
  })

  describe('getActivePet', () => {
    it('should return current active pet', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up pets and active pet
      act(() => {
        result.current.setPets([mockPet1])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.getActivePet()).toEqual(mockPet1)
    })

    it('should return null when no active pet', () => {
      const { result } = renderHook(() => usePetsStore())
      
      expect(result.current.getActivePet()).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => usePetsStore())
      
      // Set up some state
      act(() => {
        result.current.setPets([mockPet1, mockPet2])
        result.current.setActivePet(mockPet1)
      })
      
      expect(result.current.pets).toEqual([mockPet1, mockPet2])
      expect(result.current.activePet).toEqual(mockPet1)
      
      // Reset
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.pets).toEqual([])
      expect(result.current.activePet).toBeNull()
    })
  })
})