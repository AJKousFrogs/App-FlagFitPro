// USDA FoodData Central Search Edge Function
// Proxies requests to USDA API with proper authentication
// https://fdc.nal.usda.gov/api-guide.html

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildRequestContext,
  createLogger,
} from "../_shared/structured-logger.ts";

interface USDASearchRequest {
  query: string;
  pageSize?: number;
  pageNumber?: number;
  dataType?: string[];
}

const logger = createLogger("supabase.search-usda-foods");

serve(async (req) => {
  const requestLogger = logger.child(buildRequestContext(req));

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      query,
      pageSize = 25,
      pageNumber = 1,
      dataType = ["Foundation", "SR Legacy", "Branded"],
    } = (await req.json()) as USDASearchRequest;

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get USDA API key from environment
    const usdaApiKey = Deno.env.get("USDA_API_KEY");
    if (!usdaApiKey) {
      requestLogger.error("usda_api_key_missing");
      return new Response(
        JSON.stringify({ error: "USDA API not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build USDA API URL
    const usdaUrl = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    usdaUrl.searchParams.set("query", query.trim());
    usdaUrl.searchParams.set("pageSize", pageSize.toString());
    usdaUrl.searchParams.set("pageNumber", pageNumber.toString());
    usdaUrl.searchParams.set("api_key", usdaApiKey);

    // Add data types
    dataType.forEach((type) => {
      usdaUrl.searchParams.append("dataType", type);
    });

    // Call USDA API
    const usdaResponse = await fetch(usdaUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!usdaResponse.ok) {
      requestLogger.error("usda_api_request_failed", undefined, {
        query,
        status_code: usdaResponse.status,
      });
      return new Response(
        JSON.stringify({
          error: "USDA API error",
          status: usdaResponse.status,
        }),
        {
          status: usdaResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const usdaData = await usdaResponse.json();

    // Transform USDA response to our format
    const foods =
      usdaData.foods?.map((food: any) => ({
        fdcId: food.fdcId,
        description: food.description,
        dataType: food.dataType,
        brandOwner: food.brandOwner || null,
        ingredients: food.ingredients || null,
        servingSize: food.servingSize || 100,
        servingSizeUnit: food.servingSizeUnit || "g",
        nutrients: food.foodNutrients?.reduce(
          (acc: any, nutrient: any) => {
            const name = nutrient.nutrientName?.toLowerCase();
            const value = nutrient.value || 0;

            // Map common nutrients
            if (name?.includes("energy") || name?.includes("calorie")) {
              acc.calories = value;
            } else if (name?.includes("protein")) {
              acc.protein = value;
            } else if (name?.includes("carbohydrate")) {
              acc.carbohydrates = value;
            } else if (name?.includes("total lipid") || name?.includes("fat")) {
              acc.fat = value;
            } else if (name?.includes("fiber")) {
              acc.fiber = value;
            } else if (name?.includes("sugars")) {
              acc.sugar = value;
            } else if (name?.includes("sodium")) {
              acc.sodium = value;
            }

            return acc;
          },
          {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
          },
        ),
      })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: foods,
        totalHits: usdaData.totalHits || 0,
        currentPage: pageNumber,
        totalPages: Math.ceil((usdaData.totalHits || 0) / pageSize),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    requestLogger.error("usda_search_handler_failed", error);
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
