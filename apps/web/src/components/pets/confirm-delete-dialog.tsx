'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { petsService } from '@/lib/pets/pets-service'
import { Pet } from '@/types/supabase'

interface ConfirmDeleteDialogProps {
  pet: Pet | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ConfirmDeleteDialog({ pet, open, onOpenChange, onSuccess }: ConfirmDeleteDialogProps) {
  const t = useTranslations()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!pet) return

    setError(null)
    setIsDeleting(true)

    try {
      await petsService.deletePet(pet.id)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Error deleting pet:', err)
      if (err instanceof Error) {
        if (err.message.includes('Unauthorized')) {
          setError(t('pets.delete.unauthorized'))
        } else if (err.message.includes('not found')) {
          setError(t('pets.delete.notFound'))
        } else {
          setError(err.message)
        }
      } else {
        setError(t('pets.delete.deleteError'))
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (!pet) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pets.delete.title')}</DialogTitle>
          <DialogDescription>
            {t('pets.delete.description', { petName: pet.name })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
            <p className="font-medium">{t('pets.delete.warning')}</p>
            <p className="mt-1">{t('pets.delete.warningDetail')}</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}