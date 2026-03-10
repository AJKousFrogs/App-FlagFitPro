import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workout } from "../models/training.models";

interface MutationResult {
  success: boolean;
  error?: { message?: string; code?: string } | unknown;
}

export async function markWorkoutCompleteSnapshot(
  supabaseClient: SupabaseClient,
  userId: string,
  workout: Workout,
): Promise<MutationResult> {
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabaseClient.from("training_sessions").insert({
    user_id: userId,
    session_date: today,
    session_type: workout.type,
    duration_minutes: parseInt(workout.duration) || 60,
    intensity_level:
      workout.intensity === "high" ? 9 : workout.intensity === "medium" ? 6 : 3,
    status: "completed",
    notes: `Completed: ${workout.title}`,
  });

  return error ? { success: false, error } : { success: true };
}

export async function postponeWorkoutSnapshot(
  supabaseClient: SupabaseClient,
  workoutId: string,
): Promise<{ success: boolean; tomorrowDate: string; error?: { message?: string; code?: string } | unknown }> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  const { error } = await supabaseClient
    .from("training_sessions")
    .update({
      session_date: tomorrowDate,
      notes: "[Postponed]",
    })
    .eq("id", workoutId);

  return error
    ? { success: false, tomorrowDate, error }
    : { success: true, tomorrowDate };
}
