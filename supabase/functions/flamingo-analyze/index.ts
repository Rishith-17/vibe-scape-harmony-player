/**
 * AI Song Q&A Edge Function
 *
 * Uses Lovable AI (Gemini under the hood) to answer questions about songs
 * based on metadata (title, artist, genre, etc.).
 *
 * SECURITY: LOVABLE_API_KEY is fetched from Supabase secrets (server-side only)
 * Never expose the token to the client.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SongQA] 🎵 Received song Q&A request");

    // Use Lovable AI gateway instead of calling Gemini directly
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[SongQA] ❌ LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse request body - expecting song metadata + question
    const { songTitle, songArtist, question } = await req.json();

    if (!songTitle) {
      return new Response(
        JSON.stringify({ error: "Song title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[SongQA] 🎵 Song:", songTitle, "by", songArtist);
    console.log("[SongQA] 📝 Question:", question || "General analysis");

    // Build comprehensive prompt for Lovable AI (Gemini)
    const userPrompt = `You are a music expert AI assistant. Answer questions about songs based on your knowledge of music.

Song: "${songTitle}" ${songArtist ? `by ${songArtist}` : ""}

User question: ${question || "Tell me about this song - what instruments, mood, genre, and tempo does it have?"}

Provide a detailed, informative answer about the song. Include information about:
- Instruments used (if known or typical for the genre)
- Musical mood and emotion
- Genre and style
- Tempo and rhythm (fast/slow, upbeat/mellow)
- Notable musical elements or characteristics
- Any interesting facts about the song

Keep your response conversational and engaging, as if speaking to a music enthusiast.`;

    console.log("[SongQA] 🚀 Calling Lovable AI gateway (Gemini)...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful, expert music analyst. Be precise but friendly, and avoid making up specific production details if they are uncertain.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SongQA] ❌ Lovable AI gateway error:", response.status, errorText);

      // Surface rate-limit or billing errors clearly to the client
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please top up your Lovable AI usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await response.json();
    console.log("[SongQA] ✅ Analysis complete");

    // Extract Lovable AI (OpenAI-compatible) response
    let aiResponse = "";
    try {
      aiResponse = result.choices?.[0]?.message?.content || "";
    } catch (_e) {
      aiResponse = "";
    }

    if (!aiResponse) {
      aiResponse = "Unable to analyze the song. Please try again.";
    }

    console.log("[SongQA] 📤 Sending response");

    return new Response(
      JSON.stringify({
        response: aiResponse,
        question: question || "Song analysis",
        song: songTitle,
        artist: songArtist,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[SongQA] ❌ Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
