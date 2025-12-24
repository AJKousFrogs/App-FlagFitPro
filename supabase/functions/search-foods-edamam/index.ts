// Edamam Food Database API - FREE (1,000 calls/month)
// https://developer.edamam.com/
// Food Database API with nutritional information

// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface FoodSearchRequest {
  query: string;
  pageSize?: number;
  pageNumber?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      query,
      pageSize = 25,
      pageNumber = 1,
    } = (await req.json()) as FoodSearchRequest;

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get Edamam credentials from environment
    const appId = Deno.env.get("EDAMAM_APP_ID");
    const appKey = Deno.env.get("EDAMAM_APP_KEY");

    if (!appId || !appKey) {
      console.error("Edamam credentials not configured");
      return new Response(
        JSON.stringify({ error: "Edamam API not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build Edamam API URL
    const edamamUrl = new URL(
      "https://api.edamam.com/api/food-database/v2/parser",
    );
    edamamUrl.searchParams.set("app_id", appId);
    edamamUrl.searchParams.set("app_key", appKey);
    edamamUrl.searchParams.set("ingr", query.trim());

    // Add pagination
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize;
    edamamUrl.searchParams.set("nutrition-type", "cooking");

    console.log(`[Edamam] Searching for: ${query}`);

    // Call Edamam API
    const edamamResponse = await fetch(edamamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!edamamResponse.ok) {
      console.error(`Edamam API error: ${edamamResponse.status}`);
      return new Response(
        JSON.stringify({
          error: "Edamam API error",
          status: edamamResponse.status,
        }),
        {
          status: edamamResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const edamamData = await edamamResponse.json();

    // Transform Edamam response to our format (compatible with USDA format)
    const foods =
      edamamData.hints?.slice(0, pageSize).map((hint: any) => {
        const food = hint.food;
        const nutrients = food.nutrients || {};

        return {
          fdcId: food.foodId,
          description: food.label,
          dataType: food.category || "Edamam",
          brandOwner: food.brand || null,
          servingSize: 100,
          servingSizeUnit: "g",
          nutrients: {
            calories: nutrients.ENERC_KCAL || 0,
            protein: nutrients.PROCNT || 0,
            carbohydrates: nutrients.CHOCDF || 0,
            fat: nutrients.FAT || 0,
            fiber: nutrients.FIBTG || 0,
            sugar: nutrients.SUGAR || 0,
            sodium: nutrients.NA || 0,
          },
          // Additional Edamam-specific data
          image: food.image || null,
          foodContentsLabel: food.foodContentsLabel || null,
        };
      }) || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: foods,
        totalHits:
          edamamData.parsed?.length + edamamData.hints?.length || foods.length,
        currentPage: pageNumber,
        totalPages: Math.ceil((edamamData.hints?.length || 0) / pageSize),
        source: "edamam",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
