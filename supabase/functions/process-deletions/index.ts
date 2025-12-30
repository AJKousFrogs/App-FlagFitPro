/**
 * Process Deletions Edge Function
 * 
 * Scheduled job that runs daily to:
 * 1. Process account deletions that have passed the 30-day retention period
 * 2. Clean up expired emergency medical records (7 years)
 * 
 * This function should be triggered by a cron job (e.g., Supabase Cron or external scheduler)
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify this is an authorized request (from cron or admin)
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Allow service role key or specific cron secret
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("X-Cron-Secret");
  
  const isAuthorized = 
    (authHeader === `Bearer ${serviceRoleKey}`) ||
    (cronSecret && providedSecret === cronSecret);

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey!);

    const results = {
      deletionsProcessed: 0,
      deletionsFailed: 0,
      emergencyRecordsCleaned: 0,
      errors: [] as string[],
    };

    // 1. Get deletions ready for processing
    const { data: pendingDeletions, error: fetchError } = await supabase
      .rpc("get_deletions_ready_for_processing");

    if (fetchError) {
      results.errors.push(`Failed to fetch pending deletions: ${fetchError.message}`);
    } else if (pendingDeletions && pendingDeletions.length > 0) {
      console.log(`Processing ${pendingDeletions.length} pending deletions`);

      for (const deletion of pendingDeletions) {
        try {
          // Process the hard deletion
          const { data: success, error: deleteError } = await supabase
            .rpc("process_hard_deletion", { p_request_id: deletion.request_id });

          if (deleteError) {
            results.errors.push(`Failed to process deletion ${deletion.request_id}: ${deleteError.message}`);
            results.deletionsFailed++;
          } else if (success) {
            // Also delete from auth.users via Admin API
            const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
              deletion.user_id
            );

            if (authDeleteError) {
              results.errors.push(`Failed to delete auth user ${deletion.user_id}: ${authDeleteError.message}`);
              results.deletionsFailed++;
            } else {
              results.deletionsProcessed++;
              console.log(`Successfully processed deletion for user ${deletion.user_id}`);
            }
          } else {
            results.deletionsFailed++;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          results.errors.push(`Error processing deletion ${deletion.request_id}: ${message}`);
          results.deletionsFailed++;
        }
      }
    }

    // 2. Clean up expired emergency medical records
    const { data: cleanedCount, error: cleanupError } = await supabase
      .rpc("cleanup_expired_emergency_records");

    if (cleanupError) {
      results.errors.push(`Failed to cleanup emergency records: ${cleanupError.message}`);
    } else {
      results.emergencyRecordsCleaned = cleanedCount || 0;
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired emergency medical records`);
      }
    }

    // Log summary
    console.log("Deletion processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-deletions:", message);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});


