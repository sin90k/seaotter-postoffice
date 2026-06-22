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

const retryableStatuses = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callOpenAi = async (baseUrl: string, apiKey: string, endpoint: string, payload: Record<string, unknown>) => {
  const isChat = endpoint === "/chat/completions";
  const maxAttempts = isChat ? 2 : 1;
  const timeoutMs = isChat ? 40_000 : 110_000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await readOpenAiJson(response);
      if (attempt < maxAttempts && retryableStatuses.has(response.status)) {
        console.warn("[postcard-ai] Retrying transient OpenAI response", { endpoint, status: response.status, attempt });
        await sleep(700 * attempt);
        continue;
      }
      return { response, data, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) break;
      console.warn("[postcard-ai] Retrying interrupted OpenAI request", {
        endpoint,
        attempt,
        message: error instanceof Error ? error.message : "request interrupted",
      });
      await sleep(700 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  const timedOut = lastError instanceof DOMException && lastError.name === "AbortError";
  throw new Error(timedOut ? "OpenAI analysis timed out after automatic retry." : (lastError instanceof Error ? lastError.message : "OpenAI request failed"));
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

const sanitizeImagePayload = (payload: Record<string, unknown>, model?: string) => {
  const next = { ...payload };
  const requestedModel = String(next.model || "");
  const preferredModel = model || Deno.env.get("OPENAI_IMAGE_MODEL") || Deno.env.get("VITE_OPENAI_IMAGE_MODEL") || "gpt-image-2";
  if (!requestedModel || requestedModel.startsWith("dall-e")) {
    next.model = preferredModel;
  }
  return next;
};

const shouldRetryImageModel = (response: Response, data: any) => {
  if (response.ok || response.status !== 400) return false;
  const message = String(data?.error?.message || "").toLowerCase();
  return message.includes("model") && (message.includes("does not exist") || message.includes("not found") || message.includes("unsupported"));
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
    const upstreamPayload = action === "image" ? sanitizeImagePayload(payload as Record<string, unknown>) : payload;
    let { response, data } = await callOpenAi(baseUrl, apiKey, endpoint, upstreamPayload);

    if (action === "image" && !response.ok && response.status === 400 && ("response_format" in upstreamPayload || "style" in upstreamPayload)) {
      const retryPayload = { ...upstreamPayload };
      delete retryPayload.response_format;
      delete retryPayload.style;
      console.error("[postcard-ai] Image request rejected, retrying without incompatible image params", {
        status: response.status,
        baseHost: new URL(baseUrl).host,
        message: data?.error?.message || "Unknown upstream error",
      });
      ({ response, data } = await callOpenAi(baseUrl, apiKey, endpoint, retryPayload));
    }

    if (action === "image" && shouldRetryImageModel(response, data)) {
      const configuredModel = Deno.env.get("OPENAI_IMAGE_MODEL") || Deno.env.get("VITE_OPENAI_IMAGE_MODEL");
      const currentModel = String((upstreamPayload as Record<string, unknown>).model || "");
      const fallbackModels = [configuredModel, "gpt-image-2", "gpt-image-1"].filter(
        (model, index, arr): model is string => !!model && model !== currentModel && arr.indexOf(model) === index
      );
      for (const model of fallbackModels) {
        const retryPayload = sanitizeImagePayload(upstreamPayload as Record<string, unknown>, model);
        delete retryPayload.response_format;
        delete retryPayload.style;
        console.error("[postcard-ai] Image model unavailable, retrying with fallback model", {
          from: currentModel || "unknown",
          to: model,
          message: data?.error?.message || "Unknown upstream error",
        });
        ({ response, data } = await callOpenAi(baseUrl, apiKey, endpoint, retryPayload));
        if (!shouldRetryImageModel(response, data)) break;
      }
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
