/**
 * This utility function calculates the total minutes for a task by summing the minutes of all time logs for the task.
 * It then updates the task's totalMinutes field in the database.
 */
import { supabaseClient } from "./supabaseClient"

export const calculateAndUpdateTaskTotalMinutes = async (taskId: number) => {
  try {
    // First get all time logs for the task
    const { data: timeLogs, error: timeLogsError } = await supabaseClient
      .from("time_logs")
      .select("minutes")
      .eq("task_id", taskId)

    if (timeLogsError) throw timeLogsError

    // Calculate total minutes
    const totalMinutes =
      timeLogs?.reduce((sum, log) => sum + (log.minutes || 0), 0) || 0

    // Update the task's totalMinutes
    const { error: updateError } = await supabaseClient
      .from("tasks")
      .update({ totalMinutes })
      .eq("id", taskId)

    if (updateError) throw updateError

    return totalMinutes
  } catch (error) {
    console.error("Error updating task total minutes:", error)
    throw error
  }
}
