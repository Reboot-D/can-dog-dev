import Image from "next/image"
import Link from "next/link"
import { Bell, LogOut, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { logoutUser } from "./actions"

// In a real app, this would come from the user's session/database
const userData = {
  name: "Sophia Bennett",
  email: "sophia.bennett@email.com",
  joinedYear: "2021",
  avatar: "/placeholder.svg?height=120&width=120",
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* User Profile Section */}
      <div className="text-center">
        <div className="mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-orange-200 to-orange-300">
          <Image
            src={userData.avatar || "/placeholder.svg"}
            alt={`${userData.name}'s profile picture`}
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
        <p className="mt-1 text-gray-500">{userData.email}</p>
        <p className="mt-1 text-sm text-gray-400">Joined in {userData.joinedYear}</p>
      </div>

      {/* Settings Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
        <div className="mt-4 space-y-2">
          <Link href="/dashboard/settings">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-700">Notification Preferences</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <form action={logoutUser}>
            <Button type="submit" variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-transparent">
              <Card className="w-full cursor-pointer transition-all hover:shadow-md hover:bg-gray-50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <LogOut className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-700">Log Out</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
