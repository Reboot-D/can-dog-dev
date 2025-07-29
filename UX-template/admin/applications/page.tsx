"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { approveApplication, rejectApplication } from "./actions"

// Mock data matching the design
const initialApplications = [
  {
    id: 1,
    name: "Sophia Clark",
    email: "sophia.clark@email.com",
    appliedTime: "Applied 2 hours ago",
    avatar: "/placeholder.svg?height=64&width=64",
    status: "pending",
  },
  {
    id: 2,
    name: "Liam Walker",
    email: "liam.walker@email.com",
    appliedTime: "Applied 5 hours ago",
    avatar: "/placeholder.svg?height=64&width=64",
    status: "pending",
  },
  {
    id: 3,
    name: "Olivia Davis",
    email: "olivia.davis@email.com",
    appliedTime: "Applied 1 day ago",
    avatar: "/placeholder.svg?height=64&width=64",
    status: "pending",
  },
  {
    id: 4,
    name: "Noah Evans",
    email: "noah.evans@email.com",
    appliedTime: "Applied 2 days ago",
    avatar: "/placeholder.svg?height=64&width=64",
    status: "pending",
  },
  {
    id: 5,
    name: "Emma Foster",
    email: "emma.foster@email.com",
    appliedTime: "Applied 3 days ago",
    avatar: "/placeholder.svg?height=64&width=64",
    status: "pending",
  },
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState(initialApplications)
  const [processingIds, setProcessingIds] = useState<number[]>([])

  const handleApprove = async (id: number) => {
    setProcessingIds((prev) => [...prev, id])

    const formData = new FormData()
    formData.append("applicationId", id.toString())

    const result = await approveApplication(formData)

    if (result.success) {
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "approved" } : app)))
    }

    setProcessingIds((prev) => prev.filter((procId) => procId !== id))
  }

  const handleReject = async (id: number) => {
    setProcessingIds((prev) => [...prev, id])

    const formData = new FormData()
    formData.append("applicationId", id.toString())

    const result = await rejectApplication(formData)

    if (result.success) {
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "rejected" } : app)))
    }

    setProcessingIds((prev) => prev.filter((procId) => procId !== id))
  }

  const pendingApplications = applications.filter((app) => app.status === "pending")

  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">User Application Management</h1>
        <p className="text-gray-500">Manage user applications for PetPal</p>
      </div>

      <div className="mt-8 space-y-4">
        {pendingApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No pending applications to review.</p>
            </CardContent>
          </Card>
        ) : (
          pendingApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={application.avatar || "/placeholder.svg"}
                    alt={`${application.name}'s avatar`}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{application.name}</h3>
                    <p className="text-sm text-gray-500">{application.appliedTime}</p>
                    <p className="text-sm text-gray-600">{application.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(application.id)}
                    disabled={processingIds.includes(application.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {processingIds.includes(application.id) ? "Processing..." : "Reject"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(application.id)}
                    disabled={processingIds.includes(application.id)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {processingIds.includes(application.id) ? "Processing..." : "Approve"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
