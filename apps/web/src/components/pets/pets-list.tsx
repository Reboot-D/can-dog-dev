'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { petsService } from '@/lib/pets/pets-service'
import { Pet } from '@/types/supabase'

interface PetsListProps {
  onAddPetClick?: () => void
  refreshTrigger?: number // Can be used to trigger refresh from parent
  onEditPet?: (pet: Pet) => void
  onDeletePet?: (pet: Pet) => void
}

export function PetsList({ onAddPetClick, refreshTrigger, onEditPet, onDeletePet }: PetsListProps) {
  const t = useTranslations()
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedPets = await petsService.getPets()
      setPets(fetchedPets)
    } catch (err) {
      console.error('Error loading pets:', err)
      setError(t('pets.list.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Load pets on component mount and when refreshTrigger changes
  useEffect(() => {
    loadPets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return t('pets.list.petCard.unknownAge')
    
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const ageInMs = today.getTime() - birthDate.getTime()
    const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25))
    
    if (ageInYears === 0) {
      const ageInMonths = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44))
      return ageInMonths === 0 ? t('pets.list.petCard.lessThanMonth') : t('pets.list.petCard.monthsOld', { months: ageInMonths })
    }
    
    return t('pets.list.petCard.yearsOld', { years: ageInYears })
  }

  const formatBirthDate = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return ''
    
    const birthDate = new Date(dateOfBirth)
    return birthDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEditPet = (pet: Pet) => {
    onEditPet?.(pet)
  }

  const handleDeletePet = (pet: Pet) => {
    onDeletePet?.(pet)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('pets.list.loadingPets')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-2">{error}</p>
        </div>
        <button
          onClick={loadPets}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('pets.list.retryLoad')}
        </button>
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('pets.list.noPetsYet')}
        </h3>
        <p className="text-gray-500 mb-6">
          {t('pets.list.noPetsDescription')}
        </p>
        <button
          onClick={onAddPetClick}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('pets.list.addFirstPet')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('pets.list.title')}
        </h2>
        <span className="text-sm text-gray-500">
          {t('pets.list.petCount', { count: pets.length })}
        </span>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {pet.name}
                </h3>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium">{t('pets.breed')}:</span>
                    <span className="ml-2">
                      {pet.breed || t('pets.list.petCard.unknownBreed')}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium">{t('pets.list.petCard.age')}:</span>
                    <span className="ml-2">{calculateAge(pet.date_of_birth)}</span>
                  </div>
                  
                  {pet.date_of_birth && (
                    <div className="flex items-center">
                      <span className="font-medium">{t('pets.list.petCard.born')}:</span>
                      <span className="ml-2">{formatBirthDate(pet.date_of_birth)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="ml-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {pet.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {t('pets.list.petCard.createdOn', { 
                    date: new Date(pet.created_at).toLocaleDateString('zh-CN') 
                  })}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPet(pet)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-200"
                    title={t('common.edit')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePet(pet)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                    title={t('common.delete')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}