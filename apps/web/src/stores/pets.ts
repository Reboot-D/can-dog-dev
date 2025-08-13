import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Pet } from '@/types/supabase'

interface PetsState {
  // Pets data
  pets: Pet[]
  activePet: Pet | null
  
  // State management actions
  setPets: (pets: Pet[]) => void
  setActivePet: (pet: Pet | null) => void
  
  // Utility actions
  addPet: (pet: Pet) => void
  removePet: (petId: string) => void
  updatePet: (petId: string, updates: Partial<Pet>) => void
  getActivePet: () => Pet | null
  
  // Reset store
  reset: () => void
}

// Initial state
const initialState = {
  pets: [],
  activePet: null,
}

export const usePetsStore = create<PetsState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Set all pets
      setPets: (pets: Pet[]) => {
        set((state) => {
          // If current active pet is not in the new pets list, clear it
          const activePetStillExists = pets.find(p => p.id === state.activePet?.id)
          return {
            pets,
            activePet: activePetStillExists ? state.activePet : null
          }
        })
      },
      
      // Set active pet with validation
      setActivePet: (pet: Pet | null) => {
        set((state) => {
          // Only set if pet exists in the current pets list
          if (pet && !state.pets.find(p => p.id === pet.id)) {
            console.warn('Trying to set active pet that does not exist in pets list')
            return state
          }
          return { activePet: pet }
        })
      },
      
      // Add a new pet
      addPet: (pet: Pet) => {
        set((state) => ({
          pets: [...state.pets, pet],
          // Auto-select as active if it's the first pet
          activePet: state.pets.length === 0 ? pet : state.activePet
        }))
      },
      
      // Remove a pet
      removePet: (petId: string) => {
        set((state) => {
          const newPets = state.pets.filter(p => p.id !== petId)
          let newActivePet = state.activePet
          
          // If we're removing the active pet, select another one
          if (state.activePet?.id === petId) {
            newActivePet = newPets.length > 0 ? newPets[0] : null
          }
          
          return {
            pets: newPets,
            activePet: newActivePet
          }
        })
      },
      
      // Update a pet
      updatePet: (petId: string, updates: Partial<Pet>) => {
        set((state) => ({
          pets: state.pets.map(pet => 
            pet.id === petId ? { ...pet, ...updates } : pet
          ),
          // Update active pet if it's the one being updated
          activePet: state.activePet?.id === petId 
            ? { ...state.activePet, ...updates }
            : state.activePet
        }))
      },
      
      // Get active pet (utility function)
      getActivePet: () => {
        return get().activePet
      },
      
      // Reset the store
      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'pets-store',
      // Only persist essential data
      partialize: (state) => ({
        activePet: state.activePet,
        // Note: We don't persist pets array as it should be fetched fresh from API
      }),
      // Handle hydration carefully
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear pets on rehydration - they should be fetched fresh
          state.pets = []
        }
      }
    }
  )
)