"use client"

import { useEffect, useState, Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import TodoList from "@/components/todo-list"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function TodosPageContent() {
  const [userPets, setUserPets] = useState<any[]>([])
  const [selectedPetId, setSelectedPetId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    async function fetchUserPets() {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/login')
          return
        }

        // Get user's pets
        const { data: pets, error: petsError } = await supabase
          .from('pets')
          .select('id, name, breed_primary')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (petsError) {
          console.error('Error fetching pets:', petsError)
          return
        }

        setUserPets(pets || [])
        
        // Set initial selected pet from URL param or first pet
        const petIdFromUrl = searchParams.get('petId')
        if (petIdFromUrl && pets?.some(p => p.id === petIdFromUrl)) {
          setSelectedPetId(petIdFromUrl)
        } else if (pets && pets.length > 0) {
          setSelectedPetId(pets[0].id)
        }
        
      } catch (error) {
        console.error('Error fetching user pets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPets()
  }, [router, searchParams])

  const handlePetChange = (petId: string) => {
    setSelectedPetId(petId)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('petId', petId)
    window.history.pushState({}, '', url.toString())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (userPets.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">AI任务管理</h1>
        </div>
        
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">您还没有宠物档案</p>
          <Link href="/dashboard/add-pet">
            <Button>创建宠物档案</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">AI任务管理</h1>
      </div>

      {/* Pet Selector */}
      {userPets.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择宠物：
          </label>
          <div className="flex flex-wrap gap-2">
            {userPets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => handlePetChange(pet.id)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedPetId === pet.id
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pet.name} ({pet.breed_primary})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Todo List */}
      {selectedPetId && (
        <TodoList 
          petId={selectedPetId}
          showFilters={true}
          showHeader={true}
          className="mb-8"
        />
      )}
    </div>
  )
}

export default function TodosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">加载中...</div>
      </div>
    }>
      <TodosPageContent />
    </Suspense>
  )
}