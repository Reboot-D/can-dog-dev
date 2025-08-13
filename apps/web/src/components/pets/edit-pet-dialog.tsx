'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Pet, PetUpdate } from '@/types/supabase'
import { petsService } from '@/lib/pets/pets-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'

interface EditPetDialogProps {
  pet: Pet | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditPetDialog({ pet, open, onOpenChange, onSuccess }: EditPetDialogProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    date_of_birth: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when pet changes or dialog opens
  useEffect(() => {
    if (pet && open) {
      setFormData({
        name: pet.name || '',
        breed: pet.breed || '',
        date_of_birth: pet.date_of_birth ? pet.date_of_birth.split('T')[0] : ''
      })
      setErrors({})
    }
  }, [pet, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('pets.form.errors.nameRequired')
    } else if (formData.name.length > 100) {
      newErrors.name = t('pets.form.errors.nameTooLong')
    }

    if (formData.breed && formData.breed.length > 100) {
      newErrors.breed = t('pets.form.errors.breedTooLong')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pet || !validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      const updateData: Partial<PetUpdate> = {
        name: formData.name.trim(),
        breed: formData.breed.trim() || null,
        date_of_birth: formData.date_of_birth || null
      }

      await petsService.updatePet(pet.id, updateData)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating pet:', error)
      if (error instanceof Error) {
        if (error.message.includes('already have a pet with this name')) {
          setErrors({ name: t('pets.form.errors.duplicateName') })
        } else if (error.message.includes('Unauthorized')) {
          setErrors({ submit: error.message })
        } else if (error.message.includes('Pet not found')) {
          setErrors({ submit: error.message })
        } else {
          setErrors({ submit: t('pets.edit.errors.updateFailed') })
        }
      } else {
        setErrors({ submit: t('pets.edit.errors.updateFailed') })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pets.edit.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label={t('pets.form.petNameLabel')}
            placeholder={t('pets.form.petNamePlaceholder')}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
          />
          
          <FormInput
            label={t('pets.form.breedLabel')}
            placeholder={t('pets.form.breedPlaceholder')}
            value={formData.breed}
            onChange={(e) => handleInputChange('breed', e.target.value)}
            error={errors.breed}
          />
          
          <FormInput
            label={t('pets.form.dateOfBirthLabel')}
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            error={errors.date_of_birth}
          />

          {errors.submit && (
            <div className="text-sm text-red-600" role="alert">
              {errors.submit}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('pets.edit.updating') : t('pets.edit.updateButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}