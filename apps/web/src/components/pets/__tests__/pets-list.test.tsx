import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { PetsList } from '../pets-list'
// Mock the pets service before importing
jest.mock('@/lib/pets/pets-service', () => ({
  petsService: {
    getPets: jest.fn()
  }
}))

import { petsService } from '@/lib/pets/pets-service'
const mockPetsService = petsService as jest.Mocked<typeof petsService>

// Mock messages for testing
const messages = {
  pets: {
    breed: '品种',
    list: {
      title: '我的宠物',
      loadingPets: '正在加载宠物列表...',
      noPetsYet: '您还没有添加任何宠物',
      noPetsDescription: '点击下方按钮添加您的第一个宠物档案',
      addFirstPet: '添加我的第一个宠物',
      loadError: '加载宠物列表失败',
      retryLoad: '重新加载',
      petCount: '{count}个宠物',
      petCard: {
        age: '年龄',
        born: '生于',
        unknownBreed: '未知品种',
        unknownAge: '年龄未知',
        lessThanMonth: '小于1个月',
        monthsOld: '{months}个月',
        yearsOld: '{years}岁',
        createdOn: '创建于 {date}'
      }
    }
  }
}

const renderWithIntl = (component: React.ReactNode) => {
  return render(
    <NextIntlClientProvider locale="zh-CN" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('PetsList', () => {
  const mockOnAddPetClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state initially', () => {
    mockPetsService.getPets.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    expect(screen.getByText('正在加载宠物列表...')).toBeInTheDocument()
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // Loading spinner
  })

  it('should display empty state when no pets exist', async () => {
    mockPetsService.getPets.mockResolvedValue([])

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('您还没有添加任何宠物')).toBeInTheDocument()
    })

    expect(screen.getByText('点击下方按钮添加您的第一个宠物档案')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '添加我的第一个宠物' })).toBeInTheDocument()
  })

  it('should display pets list when pets exist', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: '小白',
        breed: '金毛',
        date_of_birth: '2022-01-01',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        photo_url: null
      },
      {
        id: 'pet-2',
        name: '小黑',
        breed: null,
        date_of_birth: null,
        user_id: 'user-123',
        created_at: '2024-01-02T00:00:00Z',
        photo_url: null
      }
    ]

    mockPetsService.getPets.mockResolvedValue(mockPets)

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('我的宠物')).toBeInTheDocument()
    })

    // Check first pet
    expect(screen.getByText('小白')).toBeInTheDocument()
    expect(screen.getByText('金毛')).toBeInTheDocument()

    // Check second pet
    expect(screen.getByText('小黑')).toBeInTheDocument()
    expect(screen.getByText('未知品种')).toBeInTheDocument()
    expect(screen.getByText('年龄未知')).toBeInTheDocument()

    // Check pet count
    expect(screen.getByText('2个宠物')).toBeInTheDocument()
  })

  it('should calculate and display pet age correctly', async () => {
    // Create a pet born 2 years ago
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    
    const mockPets = [
      {
        id: 'pet-1',
        name: '小白',
        breed: '金毛',
        date_of_birth: twoYearsAgo.toISOString().split('T')[0],
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        photo_url: null
      }
    ]

    mockPetsService.getPets.mockResolvedValue(mockPets)

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('2岁')).toBeInTheDocument()
    })
  })

  it('should display month age for pets less than 1 year old', async () => {
    // Create a pet born 6 months ago
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const mockPets = [
      {
        id: 'pet-1',
        name: '小白',
        breed: '金毛',
        date_of_birth: sixMonthsAgo.toISOString().split('T')[0],
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        photo_url: null
      }
    ]

    mockPetsService.getPets.mockResolvedValue(mockPets)

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText(/6个月/)).toBeInTheDocument()
    })
  })

  it('should handle loading errors', async () => {
    const error = new Error('Network error')
    mockPetsService.getPets.mockRejectedValue(error)

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('加载宠物列表失败')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
  })

  it('should retry loading when retry button is clicked', async () => {
    const user = userEvent.setup()
    
    // First call fails
    mockPetsService.getPets.mockRejectedValueOnce(new Error('Network error'))
    // Second call succeeds
    mockPetsService.getPets.mockResolvedValueOnce([])

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('加载宠物列表失败')).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: '重新加载' })
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('您还没有添加任何宠物')).toBeInTheDocument()
    })

    expect(mockPetsService.getPets).toHaveBeenCalledTimes(2)
  })

  it('should call onAddPetClick when add pet button is clicked in empty state', async () => {
    const user = userEvent.setup()
    mockPetsService.getPets.mockResolvedValue([])

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('您还没有添加任何宠物')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: '添加我的第一个宠物' })
    await user.click(addButton)

    expect(mockOnAddPetClick).toHaveBeenCalled()
  })

  it('should refresh pets list when refreshTrigger changes', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: '小白',
        breed: '金毛',
        date_of_birth: '2022-01-01',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        photo_url: null
      }
    ]

    mockPetsService.getPets.mockResolvedValue(mockPets)

    const { rerender } = renderWithIntl(
      <PetsList onAddPetClick={mockOnAddPetClick} refreshTrigger={0} />
    )

    await waitFor(() => {
      expect(screen.getByText('小白')).toBeInTheDocument()
    })

    expect(mockPetsService.getPets).toHaveBeenCalledTimes(1)

    // Change refreshTrigger to trigger reload
    rerender(
      <NextIntlClientProvider locale="zh-CN" messages={messages}>
        <PetsList onAddPetClick={mockOnAddPetClick} refreshTrigger={1} />
      </NextIntlClientProvider>
    )

    await waitFor(() => {
      expect(mockPetsService.getPets).toHaveBeenCalledTimes(2)
    })
  })

  it('should display formatted birth date correctly', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: '小白',
        breed: '金毛',
        date_of_birth: '2022-01-15',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        photo_url: null
      }
    ]

    mockPetsService.getPets.mockResolvedValue(mockPets)

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('生于:')).toBeInTheDocument()
      // The exact format depends on locale settings, but should contain the date
      expect(screen.getByText(/2022/)).toBeInTheDocument()
    })
  })

  it('should display pet avatar with first letter of name', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: '小白',
        breed: '金毛',
        date_of_birth: '2022-01-01',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        photo_url: null
      }
    ]

    mockPetsService.getPets.mockResolvedValue(mockPets)

    renderWithIntl(<PetsList onAddPetClick={mockOnAddPetClick} />)

    await waitFor(() => {
      expect(screen.getByText('小')).toBeInTheDocument() // First character of pet name
    })
  })
})