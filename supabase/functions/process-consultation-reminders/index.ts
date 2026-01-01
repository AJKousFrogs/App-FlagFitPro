// Supabase Edge Function: Process Consultation Reminders
// Sends push notifications to users who haven't followed up on professional consultations
//
// This function should be scheduled to run daily (e.g., via pg_cron or external scheduler)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending reminders that are due
    const { data: dueReminders, error: fetchError } = await supabase
      .from("consultation_reminders")
      .select(
        `
        *,
        consultation:pending_professional_consultations(*)
      `,
      )
      .eq("reminder_status", "pending")
      .lte("scheduled_for", new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders due", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      rescheduled: 0,
      expired: 0,
    };

    for (const reminder of dueReminders) {
      results.processed++;

      const consultation = reminder.consultation;

      // Skip if consultation is already resolved
      if (consultation?.consultation_status !== "pending") {
        await supabase
          .from("consultation_reminders")
          .update({ reminder_status: "cancelled" })
          .eq("id", reminder.id);
        continue;
      }

      try {
        // Get user's push notification tokens
        const { data: tokens } = await supabase
          .from("user_notification_tokens")
          .select("token, subscription_data")
          .eq("user_id", reminder.user_id)
          .eq("is_active", true);

        if (tokens && tokens.length > 0) {
          // Send push notification via the push function
          const pushResponse = await fetch(
            `${supabaseUrl}/functions/v1/push/send`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: reminder.user_id,
                title: reminder.title,
                body: reminder.body,
                type: "consultation_reminder",
                url: "/chat", // Open chat with Merlin
                data: {
                  consultationId: consultation.id,
                  referralType: consultation.referral_type,
                },
              }),
            },
          );

          if (pushResponse.ok) {
            results.sent++;
          }
        }

        // Update reminder as sent
        await supabase
          .from("consultation_reminders")
          .update({
            reminder_status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        // Update consultation reminder count
        const newReminderCount = (consultation.reminder_count || 0) + 1;

        if (newReminderCount >= consultation.max_reminders) {
          // Max reminders reached - mark consultation as expired
          await supabase
            .from("pending_professional_consultations")
            .update({
              consultation_status: "expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", consultation.id);
          results.expired++;
        } else {
          // Schedule next reminder (7 days later)
          const nextReminderDate = new Date();
          nextReminderDate.setDate(nextReminderDate.getDate() + 7);

          await supabase
            .from("pending_professional_consultations")
            .update({
              reminder_count: newReminderCount,
              last_reminder_sent_at: new Date().toISOString(),
              reminder_date: nextReminderDate.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", consultation.id);

          // Create next reminder
          await supabase.from("consultation_reminders").insert({
            user_id: reminder.user_id,
            consultation_id: consultation.id,
            title: `🏥 Reminder #${newReminderCount + 1}: Professional Consultation`,
            body: `Hi! This is reminder #${newReminderCount + 1} - have you been able to see the ${consultation.recommended_professional} yet? Your health is important! Once you have their guidance, I can help adjust your training. 💪`,
            scheduled_for: nextReminderDate.toISOString(),
          });

          results.rescheduled++;
        }
      } catch (sendError) {
        results.failed++;
        console.error("Failed to process reminder:", sendError);

        await supabase
          .from("consultation_reminders")
          .update({
            reminder_status: "failed",
            error_message:
              sendError instanceof Error ? sendError.message : "Unknown error",
          })
          .eq("id", reminder.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} reminders`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing consultation reminders:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
