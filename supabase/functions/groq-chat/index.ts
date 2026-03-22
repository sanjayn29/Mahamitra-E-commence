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

const ALLOWED_AUDIENCE = ["women", "girls", "babies"];
const ALLOWED_SORT = ["rating", "orders_count"];
const ALLOWED_PRODUCT_TYPES = [
  "saree",
  "kurti",
  "frock",
  "dress",
  "lehenga",
  "gown",
  "blouse",
  "top",
  "skirt",
  "salwar",
  "suit",
  "dupatta",
  "co-ord",
  "nighty",
  "jumpsuit",
];

const PRODUCT_TYPE_ALIASES: Record<string, string> = {
  sari: "saree",
  sarees: "saree",
  saree: "saree",
  kurtis: "kurti",
  kurta: "kurti",
  kurti: "kurti",
  frocks: "frock",
  frock: "frock",
  dresses: "dress",
  dress: "dress",
  lehengas: "lehenga",
  lehenga: "lehenga",
  gowns: "gown",
  gown: "gown",
  blouses: "blouse",
  blouse: "blouse",
  tops: "top",
  top: "top",
  skirts: "skirt",
  skirt: "skirt",
  salwars: "salwar",
  salwar: "salwar",
  suits: "suit",
  suit: "suit",
  dupattas: "dupatta",
  dupatta: "dupatta",
  coord: "co-ord",
  "co-ord": "co-ord",
  "co ord": "co-ord",
  nighties: "nighty",
  nighty: "nighty",
  jumpsuits: "jumpsuit",
  jumpsuit: "jumpsuit",
};

const COLOR_ALIASES: Record<string, string> = {
  grey: "gray",
  offwhite: "off white",
  "off-white": "off white",
};
const STRICT_PHRASES = [
  "exact",
  "exactly",
  "only",
  "strict",
  "must match",
  "no other",
  "same only",
];

const safeString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

const detectStrictFromMessage = (value: unknown): boolean => {
  const text = safeString(value);
  if (!text) return false;
  return STRICT_PHRASES.some((phrase) => text.includes(phrase));
};


const normalizeProductType = (value: unknown): string | null => {
  const raw = safeString(value).replace(/\s+/g, " ");
  if (!raw) return null;
  const aliased = PRODUCT_TYPE_ALIASES[raw] || raw;
  return ALLOWED_PRODUCT_TYPES.includes(aliased) ? aliased : null;
};

const normalizeAudience = (value: unknown): string | null => {
  const raw = safeString(value);
  return ALLOWED_AUDIENCE.includes(raw) ? raw : null;
};

const normalizeColor = (value: unknown): string | null => {
  const raw = safeString(value).replace(/\s+/g, " ");
  if (!raw) return null;
  return COLOR_ALIASES[raw] || raw;
};

const normalizeSort = (value: unknown): string | null => {
  const raw = safeString(value);
  return ALLOWED_SORT.includes(raw) ? raw : null;
};

const extractJsonObject = (raw: string): Record<string, unknown> | null => {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const sanitizeFilters = (raw: Record<string, unknown>, userMessage: string) => {
  // Backward compatibility: old prompt may return category instead of audience/product_type
  const categoryValue = safeString(raw.category);
  const audience =
    normalizeAudience(raw.audience) ||
    normalizeAudience(raw.category) ||
    null;

  const productType =
    normalizeProductType(raw.product_type) ||
    (categoryValue && !ALLOWED_AUDIENCE.includes(categoryValue)
      ? normalizeProductType(categoryValue)
      : null);

  const numericPrice = Number(raw.price);
  const price =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? Math.round(numericPrice)
      : null;

  // Broad by default. Strict only when explicitly requested.
  const modelStrict = typeof raw.strict === "boolean" ? raw.strict : null;
  const strict =
    modelStrict !== null ? modelStrict : detectStrictFromMessage(userMessage);

  return {
    price,
    color: normalizeColor(raw.color),
    audience,
    category: audience, // keep `category` for existing frontend compatibility
    product_type: productType,
    sort: normalizeSort(raw.sort),
    strict,
  };
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
You are a strict filter extractor for Mahamitra ecommerce.

Goal:
Return ONE JSON object that maps user intent to exact search filters.

JSON schema:
{
  "price": number | null,
  "color": string | null,
  "audience": "women" | "girls" | "babies" | null,
  "product_type": "saree" | "kurti" | "frock" | "dress" | "lehenga" | "gown" | "blouse" | "top" | "skirt" | "salwar" | "suit" | "dupatta" | "co-ord" | "nighty" | "jumpsuit" | null,
  "sort": "rating" | "orders_count" | null,
  "strict": boolean
}

Critical rules:
1) If the user asks a specific product type (example: saree), set product_type exactly and DO NOT generalize.
2) Never convert product_type into audience. "green saree" means product_type="saree", not "women".
3) Use audience only when explicitly asked (women/girls/babies).
4) If price is not mentioned, use null.
5) If color is not mentioned, use null.
6) For "top rated", set sort="rating".
7) For "popular", "most ordered", "best seller", set sort="orders_count".
8) strict=false by default.
9) strict=true only if user explicitly asks exact/only/strict matching.
10) Output only JSON. No markdown. No explanations.

User message:
"${message}"
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
          response_format: { type: "json_object" },
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
    const parsed = extractJsonObject(String(aiReply));

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Failed to parse model JSON", raw: aiReply }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

const sanitized = sanitizeFilters(parsed, message);


    return new Response(JSON.stringify(sanitized), {
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
