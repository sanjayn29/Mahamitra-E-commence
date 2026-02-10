// Supabase Edge Function: super-processor
// ──────────────────────────────────────────
// Go to Supabase Dashboard → Edge Functions → super-processor → Open Editor
// Delete ALL existing code and paste everything below, then Save & Deploy.

// @ts-nocheck — This file runs on Supabase's Deno runtime, not locally.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ── Handle preflight CORS ──
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message = body.message || "";

    // Check that the API key is configured
    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY secret is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `
You are an AI assistant for a women's clothing ecommerce website called Mahamitra.

Your task:
Extract filters from the user message and return ONLY valid JSON.

Allowed fields:
- price (number) — maximum price the user wants
- color (string)
- category (string) — e.g. "saree", "kurta", "lehenga", "dress", "women", "girls", "babies"
- sort ("rating" | "orders_count")

Rules:
- If price not mentioned, omit it
- If color not mentioned, omit it
- If category not mentioned, omit it
- If user says "top rated", use sort = "rating"
- If user says "most ordered" or "popular", use sort = "orders_count"

User message:
"${message}"

Return JSON only. No explanation. No markdown.
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + groqKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return new Response(
        JSON.stringify({ error: "Groq API error", status: groqResponse.status, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await groqResponse.json();

    if (!data.choices || !data.choices[0]) {
      return new Response(
        JSON.stringify({ error: "Unexpected Groq response", data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiReply = data.choices[0].message.content;

    return new Response(aiReply, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "AI processing failed", message: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
