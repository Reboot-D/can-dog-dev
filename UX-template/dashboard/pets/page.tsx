import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PetsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">My Pets</h1>
        <Link href="/dashboard/add-pet">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Pet
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Buddy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Golden Retriever</p>
            <p className="text-sm text-gray-500">3 years old</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Whiskers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Siamese Cat</p>
            <p className="text-sm text-gray-500">2 years old</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
