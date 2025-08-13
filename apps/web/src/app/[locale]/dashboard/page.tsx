'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/auth'
import { usePetsStore } from '@/stores/pets'
import { DashboardNavigation } from '@/components/dashboard/dashboard-navigation'
import { UpcomingEvent } from '@/components/dashboard/upcoming-event'
import { AddPetForm } from '@/components/pets/add-pet-form'
import { PetsList } from '@/components/pets/pets-list'
import { PetSwitcher } from '@/components/pets/pet-switcher'
import { EditPetDialog } from '@/components/pets/edit-pet-dialog'
import { ConfirmDeleteDialog } from '@/components/pets/confirm-delete-dialog'
import { JournalEntryForm } from '@/components/journal/journal-entry-form'
import { JournalHistory } from '@/components/journal/journal-history'
import { Pet, JournalEntry } from '@/types/supabase'
import { useUpcomingEvent } from '@/lib/events/use-upcoming-event'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import EmptyState from '@/components/empty-state'
import TodoList from '@/components/todo-list'

export default function DashboardPage() {
  const t = useTranslations()
  const { user, loading } = useAuthStore()
  const { addPet, removePet, activePet } = usePetsStore()
  const { event, loading: eventLoading } = useUpcomingEvent()
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [journalRefreshTrigger, setJournalRefreshTrigger] = useState(0)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null)

  const handlePetCreated = (pet: Pet) => {
    // Add pet to store and refresh the pets list
    addPet(pet)
    setShowAddForm(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleAddPetClick = () => {
    setShowAddForm(true)
  }

  const handleCancelAddPet = () => {
    setShowAddForm(false)
  }

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet)
  }

  const handleEditSuccess = () => {
    // Refresh the pets list display and reload pet switcher
    setRefreshTrigger(prev => prev + 1)
    // Note: The pet switcher will update automatically via the refreshTrigger
    // since it depends on the same pets data from the service
  }

  const handleDeletePet = (pet: Pet) => {
    setDeletingPet(pet)
  }

  const handleDeleteSuccess = () => {
    if (deletingPet) {
      // Remove from store (this will handle active pet switching automatically)
      removePet(deletingPet.id)
    }
    // Refresh the pets list display
    setRefreshTrigger(prev => prev + 1)
  }

  const handleJournalEntryCreated = (entry: JournalEntry) => {
    // Handle successful journal entry creation
    if (process.env.NODE_ENV === 'development') {
      console.log('Journal entry created:', entry)
    }
    // Refresh journal history to show the new entry
    setJournalRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{t('common.error')}</div>
      </div>
    )
  }

  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  // If no pets, show empty state
  if (!loading && (!activePet || usePetsStore.getState().pets.length === 0)) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]" data-testid="dashboard">
        <DashboardNavigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                {getGreeting()}，{user.email?.split('@')[0] || '朋友'}
              </h1>
              <p className="text-gray-600 mt-2">开始记录您宠物的健康生活吧</p>
            </div>
            <EmptyState onAddPet={handleAddPetClick} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative" data-testid="dashboard">
      <DashboardNavigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-8">
          {/* Dashboard Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {getGreeting()}，{user.email?.split('@')[0] || '朋友'}
            </h1>
            <p className="text-gray-600 mt-2">今天为您的爱宠安排了新的任务</p>
          </div>

          {/* Pet Switcher Section */}
          <PetSwitcher onAddPetClick={handleAddPetClick} refreshTrigger={refreshTrigger} />

          {/* AI Tasks and Upcoming Event Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Tasks */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  AI待办任务
                </h2>
                <TodoList 
                  petId={activePet?.id || ''} 
                  showFilters={false}
                  showHeader={false}
                  maxHeight="400px"
                />
              </CardContent>
            </Card>

            {/* Upcoming Event */}
            <div>
              <UpcomingEvent event={event} loading={eventLoading} />
            </div>
          </div>

          {/* Journal Section */}
          {activePet && (
            <div className="space-y-6">
              <JournalEntryForm 
                petId={activePet.id}
                petName={activePet.name}
                onEntryCreated={handleJournalEntryCreated}
              />
              <JournalHistory 
                petId={activePet.id}
                petName={activePet.name}
                refreshTrigger={journalRefreshTrigger}
              />
            </div>
          )}

          {/* Pet Management Section */}
          <div className="space-y-8">
            {/* Add Pet Section */}
            {showAddForm ? (
              <Card>
                <CardContent className="p-6">
                  <AddPetForm 
                    onPetCreated={handlePetCreated}
                    onCancel={handleCancelAddPet}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t('pets.title')}
                    </h2>
                    <Button
                      onClick={handleAddPetClick}
                      size="sm"
                    >
                      {t('pets.addPet')}
                    </Button>
                  </div>
                  
                  {/* Pets List */}
                  <PetsList 
                    onAddPetClick={handleAddPetClick}
                    refreshTrigger={refreshTrigger}
                    onEditPet={handleEditPet}
                    onDeletePet={handleDeletePet}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      {!showAddForm && (
        <Button 
          onClick={handleAddPetClick}
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          size="icon"
        >
          <Plus className="h-8 w-8" />
        </Button>
      )}

      {/* Edit Pet Dialog */}
      <EditPetDialog
        pet={editingPet}
        open={!!editingPet}
        onOpenChange={(open) => !open && setEditingPet(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Pet Confirmation Dialog */}
      <ConfirmDeleteDialog
        pet={deletingPet}
        open={!!deletingPet}
        onOpenChange={(open) => !open && setDeletingPet(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}