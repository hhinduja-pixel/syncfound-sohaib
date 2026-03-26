import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentUser, targetUser } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert co-founder matching algorithm. Analyze two founder profiles and calculate a compatibility score based on these weighted criteria:
- Vision Alignment (30%): How well their startup ideas, domains, and long-term visions align
- Skill Complementarity (25%): How well their skills complement each other (not overlap)
- Personality Match (20%): MBTI, work style, risk appetite compatibility
- Time Commitment Match (15%): How well their time commitments align
- Location Proximity (10%): How close they are geographically

Return ONLY a JSON object with scores for each category (0-100) and explanation.`;

    const userPrompt = `Current User Profile:
- Name: ${currentUser.full_name}
- Primary Role: ${currentUser.primary_role || 'Not specified'}
- Secondary Role: ${currentUser.secondary_role || 'Not specified'}
- Domain: ${currentUser.domain || 'Not specified'}
- Startup Idea: ${currentUser.startup_idea || 'Not specified'}
- Funding Stage: ${currentUser.funding_stage || 'Not specified'}
- Time Commitment: ${currentUser.time_commitment || 'Not specified'}
- MBTI: ${currentUser.mbti || 'Not specified'}
- Work Style: ${currentUser.work_style || 'Not specified'}
- Risk Appetite: ${currentUser.risk_appetite || 'Not specified'}
- City: ${currentUser.city || 'Not specified'}
- Skills: ${currentUser.skills?.join(', ') || 'Not specified'}

Target User Profile:
- Name: ${targetUser.full_name}
- Primary Role: ${targetUser.primary_role || 'Not specified'}
- Secondary Role: ${targetUser.secondary_role || 'Not specified'}
- Domain: ${targetUser.domain || 'Not specified'}
- Startup Idea: ${targetUser.startup_idea || 'Not specified'}
- Funding Stage: ${targetUser.funding_stage || 'Not specified'}
- Time Commitment: ${targetUser.time_commitment || 'Not specified'}
- MBTI: ${targetUser.mbti || 'Not specified'}
- Work Style: ${targetUser.work_style || 'Not specified'}
- Risk Appetite: ${targetUser.risk_appetite || 'Not specified'}
- City: ${targetUser.city || 'Not specified'}
- Skills: ${targetUser.skills?.join(', ') || 'Not specified'}

Calculate compatibility scores and provide brief explanations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "calculate_compatibility",
              description: "Calculate compatibility scores between two founders",
              parameters: {
                type: "object",
                properties: {
                  vision_alignment: { type: "number", description: "Score 0-100 for vision alignment" },
                  skill_complementarity: { type: "number", description: "Score 0-100 for skill complementarity" },
                  personality_match: { type: "number", description: "Score 0-100 for personality match" },
                  time_commitment_match: { type: "number", description: "Score 0-100 for time commitment match" },
                  location_proximity: { type: "number", description: "Score 0-100 for location proximity" },
                  explanation: { type: "string", description: "Brief explanation of the compatibility" }
                },
                required: ["vision_alignment", "skill_complementarity", "personality_match", "time_commitment_match", "location_proximity", "explanation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "calculate_compatibility" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const scores = JSON.parse(toolCall.function.arguments);
    
    // Calculate weighted total score
    const totalScore = Math.round(
      (scores.vision_alignment * 0.30) +
      (scores.skill_complementarity * 0.25) +
      (scores.personality_match * 0.20) +
      (scores.time_commitment_match * 0.15) +
      (scores.location_proximity * 0.10)
    );

    return new Response(
      JSON.stringify({
        totalScore,
        breakdown: {
          visionAlignment: scores.vision_alignment,
          skillComplementarity: scores.skill_complementarity,
          personalityMatch: scores.personality_match,
          timeCommitmentMatch: scores.time_commitment_match,
          locationProximity: scores.location_proximity
        },
        explanation: scores.explanation
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calculate-compatibility function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});