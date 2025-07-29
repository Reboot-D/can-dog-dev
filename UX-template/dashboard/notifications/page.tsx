import { Card, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>

      <div className="mt-8 space-y-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Vaccination Reminder</h3>
              <p className="text-sm text-gray-600">Buddy's annual vaccination is due next week</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Task Completed</h3>
              <p className="text-sm text-gray-600">Morning walk task marked as complete</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
