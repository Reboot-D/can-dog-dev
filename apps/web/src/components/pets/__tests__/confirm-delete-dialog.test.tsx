import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ConfirmDeleteDialog } from '../confirm-delete-dialog'
import { Pet } from '@/types/supabase'

// Mock the pets service before importing
jest.mock('@/lib/pets/pets-service', () => ({
  petsService: {
    deletePet: jest.fn()
  }
}))

import { petsService } from '@/lib/pets/pets-service'
const mockPetsService = petsService as jest.Mocked<typeof petsService>

// Mock messages for testing
const messages = {
  common: {
    cancel: '取消',
    delete: '删除',
    deleting: '删除中...'
  },
  pets: {
    delete: {
      title: '删除宠物档案',
      description: '您确定要删除 {petName} 的档案吗？',
      warning: '警告：此操作无法撤销',
      warningDetail: '删除后，所有相关的健康记录、日程安排等数据也将被永久删除。',
      confirmTitle: '删除宠物档案',
      confirmMessage: '您确定要删除 {petName} 的档案吗？此操作无法撤销。',
      deleteButton: '删除',
      deleting: '删除中...',
      success: '宠物档案删除成功！',
      unauthorized: '您没有权限删除此宠物档案',
      notFound: '宠物档案未找到',
      deleteError: '删除宠物档案失败',
      errors: {
        deleteFailed: '删除宠物档案失败，请重试'
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

describe('ConfirmDeleteDialog', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when closed', () => {
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={false}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.queryByText('删除宠物档案')).not.toBeInTheDocument()
  })

  it('should render dialog when open', () => {
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('删除宠物档案')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除' })).toBeInTheDocument()
  })

  it('should display confirmation message with pet name', () => {
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('您确定要删除 小白 的档案吗？')).toBeInTheDocument()
  })

  it('should display warning icon', () => {
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Check for warning icon (svg element)
    const warningIcon = screen.getByRole('img', { hidden: true })
    expect(warningIcon).toBeInTheDocument()
  })

  it('should successfully delete pet', async () => {
    const user = userEvent.setup()
    
    mockPetsService.deletePet.mockResolvedValue()
    
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const deleteButton = screen.getByRole('button', { name: '删除' })
    await user.click(deleteButton)

    expect(mockPetsService.deletePet).toHaveBeenCalledWith('pet-1')

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should show loading state during deletion', async () => {
    const user = userEvent.setup()
    
    // Make the service call hang
    mockPetsService.deletePet.mockImplementation(() => new Promise(() => {}))
    
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const deleteButton = screen.getByRole('button', { name: '删除' })
    await user.click(deleteButton)

    expect(screen.getByText('删除中...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除中...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '取消' })).toBeDisabled()
  })

  it('should handle deletion error', async () => {
    const user = userEvent.setup()
    
    mockPetsService.deletePet.mockRejectedValue(new Error('Network error'))
    
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const deleteButton = screen.getByRole('button', { name: '删除' })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('删除宠物档案失败，请重试')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('should display error message with proper styling', async () => {
    const user = userEvent.setup()
    
    mockPetsService.deletePet.mockRejectedValue(new Error('Network error'))
    
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const deleteButton = screen.getByRole('button', { name: '删除' })
    await user.click(deleteButton)

    await waitFor(() => {
      const errorMessage = screen.getByText('删除宠物档案失败，请重试')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage.closest('.bg-red-50')).toBeInTheDocument() // Error styling
    })
  })

  it('should close dialog when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    renderWithIntl(
      <ConfirmDeleteDialog
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

  it('should not close dialog when loading', async () => {
    const user = userEvent.setup()
    
    // Make the service call hang to simulate loading
    mockPetsService.deletePet.mockImplementation(() => new Promise(() => {}))
    
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const deleteButton = screen.getByRole('button', { name: '删除' })
    const cancelButton = screen.getByRole('button', { name: '取消' })
    
    await user.click(deleteButton)
    
    // Now both buttons should be disabled
    expect(cancelButton).toBeDisabled()
    
    await user.click(cancelButton)
    
    // Should not call onOpenChange when loading
    expect(mockOnOpenChange).not.toHaveBeenCalled()
  })

  it('should handle pet being null', () => {
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Should not render anything when pet is null
    expect(screen.queryByText('删除宠物档案')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should clear error when dialog reopens', () => {
    // First render with error state
    mockPetsService.deletePet.mockRejectedValueOnce(new Error('Network error'))
    
    const { rerender } = renderWithIntl(
      <ConfirmDeleteDialog
        pet={mockPet}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Trigger error by clicking delete
    const deleteButton = screen.getByRole('button', { name: '删除' })
    userEvent.click(deleteButton)

    // Close dialog
    rerender(
      <NextIntlClientProvider locale="zh-CN" messages={messages}>
        <ConfirmDeleteDialog
          pet={mockPet}
          open={false}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      </NextIntlClientProvider>
    )

    // Reopen dialog
    rerender(
      <NextIntlClientProvider locale="zh-CN" messages={messages}>
        <ConfirmDeleteDialog
          pet={mockPet}
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      </NextIntlClientProvider>
    )

    // Error message should be cleared
    expect(screen.queryByText('删除宠物档案失败，请重试')).not.toBeInTheDocument()
  })

  it('should handle different pet names correctly', () => {
    const petWithChineseName = { ...mockPet, name: '小黄' }
    
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={petWithChineseName}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('您确定要删除 小黄 的档案吗？')).toBeInTheDocument()
  })

  it('should not call deletePet when pet is null', async () => {
    renderWithIntl(
      <ConfirmDeleteDialog
        pet={null}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Component returns null when pet is null, so no dialog is rendered
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockPetsService.deletePet).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnOpenChange).not.toHaveBeenCalled()
  })
})