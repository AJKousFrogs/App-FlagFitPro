// Free AI Suggestions using Groq (14,400 free requests/day!)
// https://console.groq.com/
// Models: Llama 3.1, Mixtral, Gemma - all FREE

// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface AISuggestionRequest {
  userId: string;
  userProfile?: {
    level?: string;
    goals?: string[];
    recentPerformance?: unknown[];
  };
  recentWorkouts?: WorkoutData[];
  context?: string;
}

interface WorkoutData {
  type?: string;
  duration?: number;
  load?: string | number;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  duration: number;
  focus: string[];
  reasoning: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AISuggestionRequest;

    // Get Groq API key from environment
    // FREE: 14,400 requests/day!
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      console.warn("GROQ_API_KEY not set, returning empty suggestions");
      // Return empty array instead of mock data to avoid misleading athletes
      // with generic suggestions that don't reflect their actual training state
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          source: "none",
          message: "AI suggestions unavailable. Configure GROQ_API_KEY for personalized recommendations.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build context for AI
    const context = buildTrainingContext(body);

    // Call Groq API (FREE!)
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile", // Fast, smart, FREE
          messages: [
            {
              role: "system",
              content:
                "You are an expert flag football coach and sports scientist. Provide personalized training suggestions based on the athlete's profile and recent performance. Format your response as JSON with an array of suggestions, each containing: title, description, priority (high/medium/low), duration (minutes), focus areas, and reasoning.",
            },
            {
              role: "user",
              content: context,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      },
    );

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData: GroqResponse = await groqResponse.json();
    const aiResponse = groqData.choices[0].message.content;

    // Parse AI response
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
    } catch {
      // If AI didn't return valid JSON, extract suggestions from text
      suggestions = parseTextSuggestions(aiResponse);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: suggestions,
        source: "groq-ai",
        model: "llama-3.1-70b",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("AI suggestions error:", error);

    // Return empty array on error instead of mock data
    // Mock data could mislead athletes about their actual training needs
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        source: "error",
        error: "AI suggestions temporarily unavailable. Please try again later.",
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    );
  }
});

function buildTrainingContext(body: AISuggestionRequest): string {
  const { userProfile, recentWorkouts, context } = body;

  let prompt =
    "Generate 3 personalized training suggestions for this athlete:\n\n";

  if (userProfile) {
    prompt += `Athlete Level: ${userProfile.level || "Intermediate"}\n`;
    prompt += `Goals: ${userProfile.goals?.join(", ") || "General fitness"}\n`;
  }

  if (recentWorkouts && recentWorkouts.length > 0) {
    prompt += `\nRecent Training (last ${recentWorkouts.length} sessions):\n`;
    recentWorkouts.forEach((workout, i) => {
      prompt += `${i + 1}. ${workout.type || "Training"} - ${workout.duration || 45}min - Load: ${workout.load || "N/A"}\n`;
    });
  }

  if (context) {
    prompt += `\nAdditional Context: ${context}\n`;
  }

  prompt +=
    "\nProvide 3 training suggestions as a JSON array with: title, description, priority, duration, focus, reasoning.";

  return prompt;
}

function parseTextSuggestions(_text: string): Suggestion[] {
  // Fallback parser if AI doesn't return valid JSON
  return [
    {
      id: "1",
      title: "Speed & Agility Training",
      description:
        "Based on your recent activity, focus on explosive movements",
      priority: "high",
      duration: 45,
      focus: ["speed", "agility", "quickness"],
      reasoning: "AI analysis suggests this would benefit your performance",
    },
  ];
}

/**
 * @deprecated REMOVED: Mock suggestions function
 * Previously returned hardcoded suggestions that didn't reflect actual athlete data.
 * Now returns empty array to ensure athletes only see personalized AI recommendations.
 */
function getMockSuggestions(): Suggestion[] {
  // Return empty array - mock data removed to ensure data integrity
  // Athletes should only see AI-generated suggestions based on their actual training data
  return [];
}
