import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { EditPetDialog } from '../edit-pet-dialog'
import { Pet } from '@/types/supabase'

// Mock the pets service before importing
jest.mock('@/lib/pets/pets-service', () => ({
  petsService: {
    updatePet: jest.fn()
  }
}))

import { petsService } from '@/lib/pets/pets-service'
const mockPetsService = petsService as jest.Mocked<typeof petsService>

// Mock messages for testing
const messages = {
  common: {
    cancel: '取消',
    edit: '编辑',
    save: '保存'
  },
  pets: {
    form: {
      petNameLabel: '宠物名字',
      petNamePlaceholder: '请输入宠物名字',
      breedLabel: '品种',
      breedPlaceholder: '请输入宠物品种（可选）',
      dateOfBirthLabel: '出生日期',
      errors: {
        nameRequired: '宠物名字不能为空',
        nameTooLong: '宠物名字不能超过100个字符',
        breedTooLong: '品种名称不能超过100个字符',
        duplicateName: '您已经有一个同名的宠物了'
      }
    },
    edit: {
      title: '编辑宠物档案',
      updateButton: '更新档案',
      updating: '更新中...',
      success: '宠物档案更新成功！',
      errors: {
        updateFailed: '更新宠物档案失败，请重试'
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

const mockPet: Pet = {
  id: 'pet-1',
  name: '小白',
  breed: '金毛',
  date_of_birth: '2022-01-01',
  user_id: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  photo_url: null
}

describe('EditPetDialog', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when closed', () => {
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.queryByText('编辑宠物档案')).not.toBeInTheDocument()
  })

  it('should render dialog when open', () => {
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('编辑宠物档案')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更新档案' })).toBeInTheDocument()
  })

  it('should pre-populate form with pet data', () => {
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByDisplayValue('小白')).toBeInTheDocument()
    expect(screen.getByDisplayValue('金毛')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2022-01-01')).toBeInTheDocument()
  })

  it('should handle pet with null breed and date_of_birth', () => {
    const petWithNulls = {
      ...mockPet,
      breed: null,
      date_of_birth: null
    }

    renderWithIntl(
      <EditPetDialog
        pet={petWithNulls}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByDisplayValue('小白')).toBeInTheDocument()
    
    const breedInput = screen.getByLabelText('品种')
    const dateInput = screen.getByLabelText('出生日期')
    
    expect(breedInput).toHaveValue('')
    expect(dateInput).toHaveValue('')
  })

  it('should validate required name field', async () => {
    const user = userEvent.setup()
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText('宠物名字')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Clear the name field
    await user.clear(nameInput)
    await user.click(submitButton)

    expect(screen.getByText('宠物名字不能为空')).toBeInTheDocument()
    expect(mockPetsService.updatePet).not.toHaveBeenCalled()
  })

  it('should validate name length', async () => {
    const user = userEvent.setup()
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText('宠物名字')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Enter a name longer than 100 characters
    const longName = 'a'.repeat(101)
    await user.clear(nameInput)
    await user.type(nameInput, longName)
    await user.click(submitButton)

    expect(screen.getByText('宠物名字不能超过100个字符')).toBeInTheDocument()
    expect(mockPetsService.updatePet).not.toHaveBeenCalled()
  })

  it('should validate breed length', async () => {
    const user = userEvent.setup()
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const breedInput = screen.getByLabelText('品种')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Enter a breed longer than 100 characters
    const longBreed = 'b'.repeat(101)
    await user.clear(breedInput)
    await user.type(breedInput, longBreed)
    await user.click(submitButton)

    expect(screen.getByText('品种名称不能超过100个字符')).toBeInTheDocument()
    expect(mockPetsService.updatePet).not.toHaveBeenCalled()
  })

  it('should successfully update pet', async () => {
    const user = userEvent.setup()
    const updatedPet = { ...mockPet, name: '小黑', breed: '哈士奇' }
    
    mockPetsService.updatePet.mockResolvedValue(updatedPet)
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText('宠物名字')
    const breedInput = screen.getByLabelText('品种')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Update the form
    await user.clear(nameInput)
    await user.type(nameInput, '小黑')
    await user.clear(breedInput)
    await user.type(breedInput, '哈士奇')
    await user.click(submitButton)

    expect(mockPetsService.updatePet).toHaveBeenCalledWith('pet-1', {
      name: '小黑',
      breed: '哈士奇',
      date_of_birth: '2022-01-01'
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should handle empty breed as null', async () => {
    const user = userEvent.setup()
    const updatedPet = { ...mockPet, breed: null }
    
    mockPetsService.updatePet.mockResolvedValue(updatedPet)
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const breedInput = screen.getByLabelText('品种')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Clear breed field
    await user.clear(breedInput)
    await user.click(submitButton)

    expect(mockPetsService.updatePet).toHaveBeenCalledWith('pet-1', {
      name: '小白',
      breed: null,
      date_of_birth: '2022-01-01'
    })
  })

  it('should handle empty date_of_birth as null', async () => {
    const user = userEvent.setup()
    const updatedPet = { ...mockPet, date_of_birth: null }
    
    mockPetsService.updatePet.mockResolvedValue(updatedPet)
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const dateInput = screen.getByLabelText('出生日期')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Clear date field
    await user.clear(dateInput)
    await user.click(submitButton)

    expect(mockPetsService.updatePet).toHaveBeenCalledWith('pet-1', {
      name: '小白',
      breed: '金毛',
      date_of_birth: null
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Make the service call hang
    mockPetsService.updatePet.mockImplementation(() => new Promise(() => {}))
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: '更新档案' })
    await user.click(submitButton)

    expect(screen.getByText('更新中...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更新中...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '取消' })).toBeDisabled()
  })

  it('should handle duplicate name error', async () => {
    const user = userEvent.setup()
    
    mockPetsService.updatePet.mockRejectedValue(
      new Error('You already have a pet with this name')
    )
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: '更新档案' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('您已经有一个同名的宠物了')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('should handle generic update error', async () => {
    const user = userEvent.setup()
    
    mockPetsService.updatePet.mockRejectedValue(new Error('Network error'))
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: '更新档案' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('更新宠物档案失败，请重试')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('should close dialog when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const cancelButton = screen.getByRole('button', { name: '取消' })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should clear errors when user starts typing', async () => {
    const user = userEvent.setup()
    
    renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText('宠物名字')
    const submitButton = screen.getByRole('button', { name: '更新档案' })

    // Trigger validation error
    await user.clear(nameInput)
    await user.click(submitButton)
    expect(screen.getByText('宠物名字不能为空')).toBeInTheDocument()

    // Start typing to clear error
    await user.type(nameInput, 'a')
    expect(screen.queryByText('宠物名字不能为空')).not.toBeInTheDocument()
  })

  it('should handle pet being null', () => {
    renderWithIntl(
      <EditPetDialog
        pet={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Should render dialog but with empty form
    expect(screen.getByText('编辑宠物档案')).toBeInTheDocument()
  })

  it('should reset form when pet changes', () => {
    const { rerender } = renderWithIntl(
      <EditPetDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByDisplayValue('小白')).toBeInTheDocument()

    const newPet = { ...mockPet, id: 'pet-2', name: '小黑' }
    
    rerender(
      <NextIntlClientProvider locale="zh-CN" messages={messages}>
        <EditPetDialog
          pet={newPet}
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      </NextIntlClientProvider>
    )

    expect(screen.getByDisplayValue('小黑')).toBeInTheDocument()
  })
})