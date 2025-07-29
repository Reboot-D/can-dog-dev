import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { completeTask } from "./actions"

// This would typically come from a database fetch based on params.id
const taskData = {
  id: 1,
  title: "Schedule Vet Appointment",
  priority: "High",
  description:
    "Max needs a check-up and vaccinations. Please schedule an appointment with Dr. Emily Carter at the Animal Care Clinic.",
  pet: {
    name: "Max",
    image: "/placeholder.svg?height=400&width=400",
  },
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">AI Task Details</h1>
        <p className="text-gray-500">Review and update the status of this AI-generated task.</p>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Task: {taskData.title}</h2>
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
          {taskData.priority} Priority
        </Badge>
      </div>

      <form action={completeTask}>
        <input type="hidden" name="taskId" value={taskData.id} />
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <Image
              src={taskData.pet.image || "/placeholder.svg"}
              alt={`Image of ${taskData.pet.name}`}
              width={400}
              height={400}
              className="rounded-lg object-cover aspect-square"
            />
            <Textarea
              name="notes"
              placeholder="Add notes about the appointment, e.g., 'Scheduled for Friday at 10 AM, confirmed with clinic.'"
              className="min-h-[120px] rounded-lg bg-gray-100"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {taskData.title} for {taskData.pet.name}
            </h3>
            <p className="text-gray-600">{taskData.description}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-4">
          <Button type="submit" name="action" value="later" variant="ghost" className="text-gray-600">
            Complete Later
          </Button>
          <Button type="submit" name="action" value="complete" className="px-6">
            Mark as Complete
          </Button>
        </div>
      </form>
    </div>
  )
}
