import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { AddPetForm } from '../add-pet-form'
// Mock the pets service before importing
jest.mock('@/lib/pets/pets-service', () => ({
  petsService: {
    createPet: jest.fn()
  }
}))

import { petsService } from '@/lib/pets/pets-service'
const mockPetsService = petsService as jest.Mocked<typeof petsService>

// Mock messages for testing
const messages = {
  common: {
    cancel: 'common.cancel'
  },
  pets: {
    form: {
      title: '添加新宠物',
      petNameLabel: 'pets.form.petNameLabel',
      petNamePlaceholder: '请输入pets.form.petNameLabel',
      breedLabel: 'pets.form.breedLabel',
      breedPlaceholder: '请输入宠物pets.form.breedLabel（可选）',
      dateOfBirthLabel: '出生日期',
      createButton: 'pets.form.createButton',
      creating: 'pets.form.creating',
      errors: {
        nameRequired: 'pets.form.errors.nameRequired',
        nameTooLong: 'pets.form.errors.nameTooLong',
        breedTooLong: 'pets.form.errors.breedTooLong',
        duplicateName: 'pets.form.errors.duplicateName',
        createFailed: 'pets.form.errors.createFailed'
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

describe('AddPetForm', () => {
  const mockOnPetCreated = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields correctly', () => {
    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    expect(screen.getByText('pets.form.title')).toBeInTheDocument()
    expect(screen.getByLabelText('pets.form.petNameLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('pets.form.breedLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('pets.form.dateOfBirthLabel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'pets.form.createButton' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument()
  })

  it('should validate required pet name field', async () => {
    const user = userEvent.setup()
    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.errors.nameRequired')).toBeInTheDocument()
    })
    expect(mockPetsService.createPet).not.toHaveBeenCalled()
  })

  it('should validate pet name length', async () => {
    const user = userEvent.setup()
    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('pets.form.petNameLabel')
    const longName = 'a'.repeat(101)
    
    await user.type(nameInput, longName)
    
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.errors.nameTooLong')).toBeInTheDocument()
    })
    expect(mockPetsService.createPet).not.toHaveBeenCalled()
  })

  it('should validate breed length', async () => {
    const user = userEvent.setup()
    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('pets.form.petNameLabel')
    const breedInput = screen.getByLabelText('pets.form.breedLabel')
    const longBreed = 'a'.repeat(101)
    
    await user.type(nameInput, '小白')
    await user.type(breedInput, longBreed)
    
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.errors.breedTooLong')).toBeInTheDocument()
    })
    expect(mockPetsService.createPet).not.toHaveBeenCalled()
  })

  it('should successfully create a pet with valid data', async () => {
    const user = userEvent.setup()
    const mockNewPet = {
      id: 'pet-1',
      name: '小白',
      breed: '金毛',
      date_of_birth: '2022-01-01',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
      photo_url: null
    }

    mockPetsService.createPet.mockResolvedValue(mockNewPet)

    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('pets.form.petNameLabel')
    const breedInput = screen.getByLabelText('pets.form.breedLabel')
    const dateInput = screen.getByLabelText('出生日期')
    
    await user.type(nameInput, '小白')
    await user.type(breedInput, '金毛')
    await user.type(dateInput, '2022-01-01')
    
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPetsService.createPet).toHaveBeenCalledWith({
        name: '小白',
        breed: '金毛',
        date_of_birth: '2022-01-01'
      })
    })

    expect(mockOnPetCreated).toHaveBeenCalledWith(mockNewPet)
  })

  it('should handle duplicate pet name error', async () => {
    const user = userEvent.setup()
    const duplicateError = new Error('You already have a pet with this name')
    
    mockPetsService.createPet.mockRejectedValue(duplicateError)

    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('pets.form.petNameLabel')
    await user.type(nameInput, '小白')
    
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.errors.duplicateName')).toBeInTheDocument()
    })

    expect(mockOnPetCreated).not.toHaveBeenCalled()
  })

  it('should handle general creation errors', async () => {
    const user = userEvent.setup()
    const genericError = new Error('Network error')
    
    mockPetsService.createPet.mockRejectedValue(genericError)

    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('pets.form.petNameLabel')
    await user.type(nameInput, '小白')
    
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.errors.createFailed')).toBeInTheDocument()
    })

    expect(mockOnPetCreated).not.toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: 'common.cancel' })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    mockPetsService.createPet.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    const nameInput = screen.getByLabelText('pets.form.petNameLabel')
    await user.type(nameInput, '小白')
    
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.creating')).toBeInTheDocument()
    })
    expect(submitButton).toBeDisabled()
  })

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithIntl(<AddPetForm onPetCreated={mockOnPetCreated} onCancel={mockOnCancel} />)

    // First, trigger a validation error
    const submitButton = screen.getByRole('button', { name: 'pets.form.createButton' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('pets.form.errors.nameRequired')).toBeInTheDocument()
    })

    // Then start typing to clear the error
    const nameInput = screen.getByDisplayValue('')
    await user.type(nameInput, '小')

    await waitFor(() => {
      expect(screen.queryByText('pets.form.errors.nameRequired')).not.toBeInTheDocument()
    })
  })
})