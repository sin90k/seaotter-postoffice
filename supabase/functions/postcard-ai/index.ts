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

  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY");
  const baseUrl = (
    Deno.env.get("OPENAI_BASE_URL") ||
    Deno.env.get("VITE_OPENAI_BASE_URL") ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  if (!apiKey) {
    console.error("[postcard-ai] Missing OPENAI_API_KEY and VITE_OPENAI_API_KEY");
    return json({ error: { code: "missing_api_key", message: "Supabase Secrets 中未找到 OPENAI_API_KEY 或 VITE_OPENAI_API_KEY。" } }, 500);
  }

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
    if (!response.ok) {
      console.error("[postcard-ai] OpenAI request rejected", {
        action,
        status: response.status,
        baseHost: new URL(baseUrl).host,
        message: data?.error?.message || "Unknown upstream error",
      });
    }
    return json(data, response.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    console.error("[postcard-ai] Request failed", { message, baseUrl });
    return json({ error: { code: "request_failed", message } }, 500);
  }
});
