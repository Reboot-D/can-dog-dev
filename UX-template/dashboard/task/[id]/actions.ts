"use server"

import { redirect } from "next/navigation"

export async function completeTask(formData: FormData) {
  const action = formData.get("action")
  const taskId = formData.get("taskId")
  const notes = formData.get("notes")

  if (action === "complete") {
    // In a real application, you would:
    // 1. Validate the input.
    // 2. Update the task status in your Supabase database.
    // 3. Save the user's notes.
    // 4. Potentially trigger another AI action based on the notes (e.g., parse the date and create a calendar event).
    console.log(`Task ${taskId} marked as complete.`)
    console.log("User notes:", notes)
  } else {
    // "Complete Later" was clicked
    console.log(`Task ${taskId} will be completed later.`)
  }

  // Redirect back to the dashboard in either case
  redirect("/dashboard")
}
