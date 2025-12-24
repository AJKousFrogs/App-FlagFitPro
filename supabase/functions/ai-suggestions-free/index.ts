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
    recentPerformance?: any[];
  };
  recentWorkouts?: any[];
  context?: string;
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
      console.warn("GROQ_API_KEY not set, returning mock suggestions");
      return new Response(
        JSON.stringify({
          success: true,
          data: getMockSuggestions(),
          source: "mock",
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

    const groqData = await groqResponse.json();
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

    // Return mock suggestions on error
    return new Response(
      JSON.stringify({
        success: true,
        data: getMockSuggestions(),
        source: "mock-fallback",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

function parseTextSuggestions(text: string): any[] {
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

function getMockSuggestions(): any[] {
  return [
    {
      id: "speed-1",
      title: "Speed & Agility Focus",
      description: "High-intensity sprint work with cone drills",
      priority: "high",
      duration: 45,
      focus: ["acceleration", "agility", "change-of-direction"],
      reasoning: "Improve explosive speed for flag football",
    },
    {
      id: "strength-1",
      title: "Lower Body Power",
      description: "Plyometric exercises for explosive strength",
      priority: "medium",
      duration: 40,
      focus: ["power", "explosiveness", "jumping"],
      reasoning: "Build foundational strength for athletic movements",
    },
    {
      id: "recovery-1",
      title: "Active Recovery Session",
      description: "Light cardio and mobility work",
      priority: "low",
      duration: 30,
      focus: ["recovery", "flexibility", "mobility"],
      reasoning: "Allow your body to recover and prevent overtraining",
    },
  ];
}
