'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { usePetsStore } from '@/stores/pets'
import { petsService } from '@/lib/pets/pets-service'
import { Pet } from '@/types/supabase'

// Constants for better maintainability
const MAX_PET_NAME_DISPLAY_WIDTH = 100
const AVATAR_SIZE = 'w-6 h-6'
const ICON_SIZE = 'w-4 h-4'

interface PetSwitcherProps {
  onAddPetClick?: () => void
  refreshTrigger?: number
}

export function PetSwitcher({ onAddPetClick, refreshTrigger }: PetSwitcherProps) {
  const t = useTranslations()
  const { activePet, setActivePet, pets, setPets } = usePetsStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedPets = await petsService.getPets()
      setPets(fetchedPets)
      
      // Auto-select first pet if no active pet is set
      if (fetchedPets.length > 0 && !activePet) {
        setActivePet(fetchedPets[0])
      }
      
      // Check if current active pet still exists
      if (activePet && !fetchedPets.find(p => p.id === activePet.id)) {
        setActivePet(fetchedPets.length > 0 ? fetchedPets[0] : null)
      }
    } catch (err) {
      console.error('Error loading pets:', err)
      // Provide user-friendly error message based on error type
      const errorMessage = err instanceof Error && err.message.includes('network') 
        ? t('pets.switcher.networkError') 
        : t('pets.switcher.loadError')
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [activePet, setPets, setActivePet, t])

  useEffect(() => {
    loadPets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const handlePetSelect = useCallback((pet: Pet) => {
    setActivePet(pet)
  }, [setActivePet])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-red-600 text-sm mb-2">{error}</div>
        <button
          onClick={loadPets}
          className="text-xs text-indigo-600 hover:text-indigo-700 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('pets.switcher.noPetsTitle')}
        </h3>
        <p className="text-gray-500 mb-4">
          {t('pets.switcher.noPetsDescription')}
        </p>
        <button
          onClick={onAddPetClick}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('pets.switcher.addFirstPet')}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" data-testid="pet-switcher">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          {t('pets.switcher.title')}
        </h3>
        <span className="text-xs text-gray-500">
          {t('pets.switcher.count', { count: pets.length })}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {pets.map((pet) => (
          <button
            key={pet.id}
            onClick={() => handlePetSelect(pet)}
            className={`
              flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${activePet?.id === pet.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }
            `}
          >
            <div className={`
              ${AVATAR_SIZE} rounded-full flex items-center justify-center text-xs font-bold mr-2
              ${activePet?.id === pet.id
                ? 'bg-white text-indigo-600'
                : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
              }
            `}>
              {pet.name.charAt(0).toUpperCase()}
            </div>
            <span className={`truncate max-w-[${MAX_PET_NAME_DISPLAY_WIDTH}px]`}>{pet.name}</span>
            {activePet?.id === pet.id && (
              <div className="ml-2">
                <svg className={ICON_SIZE} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {activePet && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            {t('pets.switcher.activePet')}: <span className="font-medium text-gray-900">{activePet.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}