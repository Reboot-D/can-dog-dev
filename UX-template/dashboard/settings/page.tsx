"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateNotificationSettings } from "./actions"

// In a real app, these initial values would come from the user's database record.
const initialSettings = {
  careReminders: true,
  taskNotifications: true,
  systemMessages: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(initialSettings)
  const [isPending, setIsPending] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const handleSwitchChange = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)
    setStatusMessage("")

    const formData = new FormData()
    formData.append("careReminders", String(settings.careReminders))
    formData.append("taskNotifications", String(settings.taskNotifications))
    formData.append("systemMessages", String(settings.systemMessages))

    const result = await updateNotificationSettings(formData)
    setIsPending(false)
    setStatusMessage(result.message)

    // Hide message after 3 seconds
    setTimeout(() => setStatusMessage(""), 3000)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800">Notification Preferences</h1>
      <form onSubmit={handleSubmit}>
        <Card className="mt-8 border-0 shadow-none">
          <CardContent className="space-y-6 p-0">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="care-reminders" className="text-base font-medium">
                  Care Reminders
                </Label>
                <p className="text-sm text-gray-500">
                  Receive reminders for pet care activities like feeding, medication, and vet appointments.
                </p>
              </div>
              <Switch
                id="care-reminders"
                checked={settings.careReminders}
                onCheckedChange={(value) => handleSwitchChange("careReminders", value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="task-notifications" className="text-base font-medium">
                  Task Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Get notified about tasks assigned to you or others in your pet care team.
                </p>
              </div>
              <Switch
                id="task-notifications"
                checked={settings.taskNotifications}
                onCheckedChange={(value) => handleSwitchChange("taskNotifications", value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="system-messages" className="text-base font-medium">
                  System Messages
                </Label>
                <p className="text-sm text-gray-500">Receive important updates and alerts from the PetPal system.</p>
              </div>
              <Switch
                id="system-messages"
                checked={settings.systemMessages}
                onCheckedChange={(value) => handleSwitchChange("systemMessages", value)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex items-center justify-end gap-4">
          {statusMessage && <p className="text-sm text-gray-600">{statusMessage}</p>}
          <Button type="submit" className="bg-primary/20 text-primary hover:bg-primary/30" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
