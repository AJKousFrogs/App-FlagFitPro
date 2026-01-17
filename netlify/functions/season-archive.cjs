/**
 * Season Archive Function
 * Archives season data and generates summary reports
 */

const { createHandler } = require("./utils/handler-factory.cjs");
const { getSupabaseClient, supabaseAdmin } = require("./supabase-client.cjs");
const { handleValidationError } = require("./utils/error-handler.cjs");

exports.handler = createHandler({
  functionName: "season-archive",
  handler: async (event, context, { userId, userRole }) => {
    const supabase = getSupabaseClient();

    // Only coaches/admins can archive seasons
    if (
      !["coach", "head_coach", "assistant_coach", "admin"].includes(userRole)
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Unauthorized",
          message: "Only coaches can archive seasons",
        }),
      };
    }

    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
      const { season_id } = body;

      if (!season_id) {
        return handleValidationError("season_id is required");
      }

      try {
        // Archive season data using database function
        const { data: _data, error } = await supabaseAdmin.rpc(
          "archive_season_data",
          {
            p_season_id: season_id,
          },
        );

        if (error) {
          throw error;
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "Season data archived successfully",
          }),
        };
      } catch (error) {
        console.error("[SeasonArchive] Error:", error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Failed to archive season",
            message: error.message,
          }),
        };
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed",
      }),
    };
  },
});
