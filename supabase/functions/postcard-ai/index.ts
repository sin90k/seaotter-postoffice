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

const readOpenAiJson = async (response: Response) =>
  response.json().catch(() => ({ error: { message: "Invalid OpenAI response" } }));

const callOpenAi = async (baseUrl: string, apiKey: string, endpoint: string, payload: Record<string, unknown>) => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await readOpenAiJson(response);
  return { response, data };
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const normalizeImageResponse = async (data: any) => {
  const image = data?.data?.[0];
  if (!image?.url || image?.b64_json) return data;

  const imageResponse = await fetch(image.url);
  if (!imageResponse.ok) return data;

  const b64 = arrayBufferToBase64(await imageResponse.arrayBuffer());
  return {
    ...data,
    data: [
      {
        ...image,
        b64_json: b64,
        mime_type: imageResponse.headers.get("content-type") || "image/png",
      },
    ],
  };
};

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
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || (action !== "chat" && action !== "image")) {
      return json({ error: "Invalid request" }, 400);
    }

    const endpoint = action === "chat" ? "/chat/completions" : "/images/generations";
    let { response, data } = await callOpenAi(baseUrl, apiKey, endpoint, payload);

    if (action === "image" && !response.ok && response.status === 400 && "response_format" in payload) {
      const retryPayload = { ...payload };
      delete retryPayload.response_format;
      console.error("[postcard-ai] Image request rejected, retrying without response_format", {
        status: response.status,
        baseHost: new URL(baseUrl).host,
        message: data?.error?.message || "Unknown upstream error",
      });
      ({ response, data } = await callOpenAi(baseUrl, apiKey, endpoint, retryPayload));
    }

    if (!response.ok) {
      console.error("[postcard-ai] OpenAI request rejected", {
        action,
        status: response.status,
        baseHost: new URL(baseUrl).host,
        message: data?.error?.message || "Unknown upstream error",
      });
    } else if (action === "image") {
      data = await normalizeImageResponse(data);
    }
    return json(data, response.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    console.error("[postcard-ai] Request failed", { message, baseUrl });
    return json({ error: { code: "request_failed", message } }, 500);
  }
});
