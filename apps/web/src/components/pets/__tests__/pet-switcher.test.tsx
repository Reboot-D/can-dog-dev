import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PetSwitcher } from '../pet-switcher'
import { usePetsStore } from '@/stores/pets'
import { petsService } from '@/lib/pets/pets-service'
import { Pet } from '@/types/supabase'

// Mock translations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'pets.switcher.title': '选择宠物',
      'pets.switcher.count': '{count}个宠物',
      'pets.switcher.loadError': '加载宠物列表失败',
      'pets.switcher.noPetsTitle': '暂无宠物',
      'pets.switcher.noPetsDescription': '您还没有添加任何宠物，请先添加一个宠物档案。',
      'pets.switcher.addFirstPet': '添加我的第一个宠物',
      'pets.switcher.activePet': '当前选中',
      'common.retry': '重试'
    }
    // Handle parameterized translations
    if (key === 'pets.switcher.count') {
      return (params: { count: number }) => `${params.count}个宠物`
    }
    return translations[key] || key
  }
}))

// Mock pets service
jest.mock('@/lib/pets/pets-service', () => ({
  petsService: {
    getPets: jest.fn()
  }
}))

// Mock pets store
jest.mock('@/stores/pets', () => ({
  usePetsStore: jest.fn()
}))

const mockPetsService = petsService as jest.Mocked<typeof petsService>
const mockUsePetsStore = usePetsStore as jest.MockedFunction<typeof usePetsStore>

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

const defaultStoreState = {
  activePet: null,
  setActivePet: jest.fn(),
  pets: [],
  setPets: jest.fn(),
  addPet: jest.fn(),
  removePet: jest.fn(),
  updatePet: jest.fn(),
  getActivePet: jest.fn(),
  reset: jest.fn()
}

describe('PetSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePetsStore.mockReturnValue(defaultStoreState)
  })

  describe('loading state', () => {
    it('should show loading skeleton while fetching pets', async () => {
      // Mock service to return a pending promise
      let resolvePets: (pets: Pet[]) => void
      mockPetsService.getPets.mockReturnValue(
        new Promise((resolve) => {
          resolvePets = resolve
        })
      )

      render(<PetSwitcher />)

      // Should show loading skeleton
      expect(screen.getByText('选择宠物')).toBeInTheDocument()
      
      // Complete the promise
      await waitFor(() => {
        resolvePets!([])
      })
    })
  })

  describe('error state', () => {
    it('should show error message when pets fail to load', async () => {
      mockPetsService.getPets.mockRejectedValue(new Error('Network error'))

      render(<PetSwitcher />)

      await waitFor(() => {
        expect(screen.getByText('加载宠物列表失败')).toBeInTheDocument()
        expect(screen.getByText('重试')).toBeInTheDocument()
      })
    })

    it('should retry loading pets when retry button is clicked', async () => {
      mockPetsService.getPets
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([mockPet1])

      render(<PetSwitcher />)

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('加载宠物列表失败')).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText('重试')
      fireEvent.click(retryButton)

      // Should call service again
      expect(mockPetsService.getPets).toHaveBeenCalledTimes(2)
    })
  })

  describe('empty state', () => {
    it('should show empty state when no pets exist', async () => {
      mockPetsService.getPets.mockResolvedValue([])

      const mockOnAddPetClick = jest.fn()
      render(<PetSwitcher onAddPetClick={mockOnAddPetClick} />)

      await waitFor(() => {
        expect(screen.getByText('暂无宠物')).toBeInTheDocument()
        expect(screen.getByText('您还没有添加任何宠物，请先添加一个宠物档案。')).toBeInTheDocument()
        expect(screen.getByText('添加我的第一个宠物')).toBeInTheDocument()
      })
    })

    it('should call onAddPetClick when add pet button is clicked in empty state', async () => {
      mockPetsService.getPets.mockResolvedValue([])

      const mockOnAddPetClick = jest.fn()
      render(<PetSwitcher onAddPetClick={mockOnAddPetClick} />)

      await waitFor(() => {
        const addButton = screen.getByText('添加我的第一个宠物')
        fireEvent.click(addButton)
        expect(mockOnAddPetClick).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('pets display', () => {
    it('should display pets when they exist', async () => {
      const mockStoreWithPets = {
        ...defaultStoreState,
        pets: [mockPet1, mockPet2],
        activePet: mockPet1
      }
      mockUsePetsStore.mockReturnValue(mockStoreWithPets)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        expect(screen.getByText('选择宠物')).toBeInTheDocument()
        expect(screen.getByText('2个宠物')).toBeInTheDocument()
        expect(screen.getByText('小白')).toBeInTheDocument()
        expect(screen.getByText('小黑')).toBeInTheDocument()
        expect(screen.getByText('当前选中: 小白')).toBeInTheDocument()
      })
    })

    it('should show first letter of pet name in avatar', async () => {
      const mockStoreWithPets = {
        ...defaultStoreState,
        pets: [mockPet1],
        activePet: null
      }
      mockUsePetsStore.mockReturnValue(mockStoreWithPets)
      mockPetsService.getPets.mockResolvedValue([mockPet1])

      render(<PetSwitcher />)

      await waitFor(() => {
        expect(screen.getByText('小')).toBeInTheDocument() // First character of '小白'
      })
    })

    it('should highlight active pet differently', async () => {
      const mockStoreWithPets = {
        ...defaultStoreState,
        pets: [mockPet1, mockPet2],
        activePet: mockPet1
      }
      mockUsePetsStore.mockReturnValue(mockStoreWithPets)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        const activePetButton = screen.getByText('小白').closest('button')
        const inactivePetButton = screen.getByText('小黑').closest('button')
        
        expect(activePetButton).toHaveClass('bg-indigo-600 text-white')
        expect(inactivePetButton).toHaveClass('bg-gray-100 text-gray-700')
      })
    })
  })

  describe('pet selection', () => {
    it('should call setActivePet when pet is clicked', async () => {
      const mockSetActivePet = jest.fn()
      const mockStoreWithPets = {
        ...defaultStoreState,
        pets: [mockPet1, mockPet2],
        activePet: mockPet1,
        setActivePet: mockSetActivePet
      }
      mockUsePetsStore.mockReturnValue(mockStoreWithPets)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        const pet2Button = screen.getByText('小黑').closest('button')
        fireEvent.click(pet2Button!)
        expect(mockSetActivePet).toHaveBeenCalledWith(mockPet2)
      })
    })
  })

  describe('store integration', () => {
    it('should update store with fetched pets', async () => {
      const mockSetPets = jest.fn()
      const mockStoreState = {
        ...defaultStoreState,
        setPets: mockSetPets
      }
      mockUsePetsStore.mockReturnValue(mockStoreState)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        expect(mockSetPets).toHaveBeenCalledWith([mockPet1, mockPet2])
      })
    })

    it('should auto-select first pet if no active pet is set', async () => {
      const mockSetActivePet = jest.fn()
      const mockStoreState = {
        ...defaultStoreState,
        activePet: null,
        setActivePet: mockSetActivePet
      }
      mockUsePetsStore.mockReturnValue(mockStoreState)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        expect(mockSetActivePet).toHaveBeenCalledWith(mockPet1)
      })
    })

    it('should clear active pet if it no longer exists in fetched pets', async () => {
      const mockSetActivePet = jest.fn()
      const nonExistentPet: Pet = { ...mockPet1, id: 'non-existent' }
      const mockStoreState = {
        ...defaultStoreState,
        activePet: nonExistentPet,
        setActivePet: mockSetActivePet
      }
      mockUsePetsStore.mockReturnValue(mockStoreState)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        expect(mockSetActivePet).toHaveBeenCalledWith(mockPet1) // First pet from the new list
      })
    })

    it('should not change active pet if it still exists in fetched pets', async () => {
      const mockSetActivePet = jest.fn()
      const mockStoreState = {
        ...defaultStoreState,
        activePet: mockPet2, // mockPet2 exists in the fetched list
        setActivePet: mockSetActivePet
      }
      mockUsePetsStore.mockReturnValue(mockStoreState)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        // Should not call setActivePet if activePet still exists
        expect(mockSetActivePet).not.toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      const mockStoreWithPets = {
        ...defaultStoreState,
        pets: [mockPet1, mockPet2],
        activePet: mockPet1
      }
      mockUsePetsStore.mockReturnValue(mockStoreWithPets)
      mockPetsService.getPets.mockResolvedValue([mockPet1, mockPet2])

      render(<PetSwitcher />)

      await waitFor(() => {
        const petButtons = screen.getAllByRole('button')
        expect(petButtons.length).toBeGreaterThan(0)
        
        // Check that buttons are focusable
        petButtons.forEach(button => {
          expect(button).toHaveAttribute('tabIndex')
        })
      })
    })
  })
})