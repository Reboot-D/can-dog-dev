'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FormInput } from '@/components/ui/form-input'
import { petsService } from '@/lib/pets/pets-service'
import { Pet } from '@/types/supabase'

interface AddPetFormProps {
  onPetCreated?: (pet: Pet) => void
  onCancel?: () => void
}

export function AddPetForm({ onPetCreated, onCancel }: AddPetFormProps) {
  const t = useTranslations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    date_of_birth: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Client-side validation
      const newErrors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        newErrors.name = t('pets.form.errors.nameRequired')
      } else if (formData.name.length > 100) {
        newErrors.name = t('pets.form.errors.nameTooLong')
      }
      
      if (formData.breed && formData.breed.length > 100) {
        newErrors.breed = t('pets.form.errors.breedTooLong')
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSubmitting(false)
        return
      }

      // Prepare data for API
      const petData = {
        name: formData.name.trim(),
        breed: formData.breed.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined
      }

      // Create pet via service
      const newPet = await petsService.createPet(petData)
      
      // Reset form
      setFormData({ name: '', breed: '', date_of_birth: '' })
      
      // Notify parent component
      onPetCreated?.(newPet)
      
    } catch (error) {
      console.error('Error creating pet:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('already have a pet with this name')) {
          setErrors({ name: t('pets.form.errors.duplicateName') })
        } else {
          setErrors({ general: t('pets.form.errors.createFailed') })
        }
      } else {
        setErrors({ general: t('pets.form.errors.createFailed') })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">
        {t('pets.form.title')}
      </h2>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label={t('pets.form.petNameLabel')}
          placeholder={t('pets.form.petNamePlaceholder')}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          required
          maxLength={100}
          disabled={isSubmitting}
        />

        <FormInput
          label={t('pets.form.breedLabel')}
          placeholder={t('pets.form.breedPlaceholder')}
          value={formData.breed}
          onChange={(e) => handleInputChange('breed', e.target.value)}
          error={errors.breed}
          maxLength={100}
          disabled={isSubmitting}
        />

        <FormInput
          label={t('pets.form.dateOfBirthLabel')}
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          error={errors.date_of_birth}
          disabled={isSubmitting}
        />

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('pets.form.creating') : t('pets.form.createButton')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}