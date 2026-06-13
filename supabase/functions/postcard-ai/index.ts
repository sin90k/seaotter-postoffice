import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const baseUrl = (Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!apiKey) return json({ error: "OPENAI_API_KEY is not configured in Supabase Secrets." }, 500);

  try {
    const body = await req.json();
    const action = body?.action;
    const payload = body?.payload;
    if (!payload || (action !== "chat" && action !== "image")) {
      return json({ error: "Invalid request" }, 400);
    }

    const endpoint = action === "chat" ? "/chat/completions" : "/images/generations";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({ error: { message: "Invalid OpenAI response" } }));
    return json(data, response.status);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI request failed" }, 500);
  }
});
