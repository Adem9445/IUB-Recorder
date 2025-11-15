export const DEFAULT_AI_PROVIDER = "openai";

export const AI_PROVIDERS = {
  openai: {
    id: "openai",
    label: "OpenAI",
    type: "openai-compatible",
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o",
    fastModel: "gpt-4o-mini",
    imagePayloadType: "image_url"
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    type: "gemini",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
    defaultModel: "gemini-1.5-flash",
    fastModel: "gemini-1.5-flash",
    imagePayloadType: "inline_data"
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    type: "openai-compatible",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    defaultModel: "deepseek-vision",
    fastModel: "deepseek-vision",
    imagePayloadType: "image_url"
  }
};

export function getProviderLabel(provider) {
  return AI_PROVIDERS[provider]?.label || AI_PROVIDERS[DEFAULT_AI_PROVIDER].label;
}

export function sanitizeProvider(provider) {
  if (provider && AI_PROVIDERS[provider]) {
    return provider;
  }
  return DEFAULT_AI_PROVIDER;
}

function normalizeKey(key) {
  return typeof key === "string" ? key.trim() : "";
}

export function resolveActiveKey({ aiApiKeys = {}, aiProvider, legacyKey }) {
  const provider = sanitizeProvider(aiProvider);
  const keyFromMap = normalizeKey(aiApiKeys[provider]);
  if (keyFromMap) {
    return { provider, key: keyFromMap, source: "provider" };
  }

  if (provider === DEFAULT_AI_PROVIDER) {
    const fallback = normalizeKey(legacyKey);
    if (fallback) {
      return { provider, key: fallback, source: "legacy" };
    }
  }

  return { provider, key: "", source: "missing" };
}

function extractImageData(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const [meta, data] = dataUrl.split(",");
  if (!data) return null;
  const mimeMatch = /data:([^;]+);base64/.exec(meta);
  return {
    data,
    mimeType: mimeMatch ? mimeMatch[1] : "image/png"
  };
}

function buildOpenAIContent({ prompt, images, imagePayloadType }) {
  const content = [];
  content.push({ type: "text", text: prompt });
  images.forEach((image) => {
    if (!image) return;
    if (imagePayloadType === "input_image" && image.base64) {
      content.push({
        type: "input_image",
        image: { base64: image.base64, mime_type: image.mimeType || "image/png" }
      });
    } else if (imagePayloadType === "image_url" && image.url) {
      content.push({
        type: "image_url",
        image_url: { url: image.url }
      });
    }
  });
  return content;
}

async function requestOpenAICompatible({
  endpoint,
  apiKey,
  prompt,
  images = [],
  maxTokens = 1000,
  model,
  imagePayloadType
}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  const content = buildOpenAIContent({ prompt, images, imagePayloadType });
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages: [{ role: "user", content }], max_tokens: maxTokens })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `API error: ${response.status}`);
  }
  const message = data?.choices?.[0]?.message?.content;
  if (typeof message !== "string") {
    throw new Error("Unexpected response from AI provider");
  }
  return message.trim();
}

async function requestGemini({ endpoint, apiKey, prompt, images = [], maxTokens = 1024 }) {
  const parts = [{ text: prompt }];
  images.forEach((image) => {
    if (!image || !image.base64) return;
    parts.push({
      inline_data: {
        mime_type: image.mimeType || "image/png",
        data: image.base64
      }
    });
  });

  const body = {
    contents: [
      {
        role: "user",
        parts
      }
    ],
    generationConfig: {
      maxOutputTokens: maxTokens
    }
  };

  const url = `${endpoint}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `API error: ${response.status}`);
  }
  const partsResponse = data?.candidates?.[0]?.content?.parts || [];
  const text = partsResponse
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
  if (!text) {
    throw new Error("The AI provider returned an empty response");
  }
  return text;
}

export async function requestVisionCompletion({
  provider,
  apiKey,
  prompt,
  imageUrls = [],
  maxTokens = 1000,
  useFastModel = false
}) {
  const config = AI_PROVIDERS[sanitizeProvider(provider)];
  if (!config) {
    throw new Error("Unsupported AI provider selected");
  }
  if (!apiKey) {
    throw new Error(`API key for ${config.label} is missing`);
  }

  const images = imageUrls.map((url) => {
    if (config.type === "gemini") {
      const parsed = extractImageData(url);
      if (!parsed) return null;
      return { base64: parsed.data, mimeType: parsed.mimeType };
    }
    if (config.imagePayloadType === "image_url") {
      return { url };
    }
    if (config.imagePayloadType === "input_image") {
      const parsed = extractImageData(url);
      if (!parsed) return null;
      return { base64: parsed.data, mimeType: parsed.mimeType };
    }
    return null;
  });

  if (config.type === "gemini") {
    return requestGemini({
      endpoint: config.endpoint,
      apiKey,
      prompt,
      images,
      maxTokens
    });
  }

  return requestOpenAICompatible({
    endpoint: config.endpoint,
    apiKey,
    prompt,
    images,
    maxTokens,
    model: useFastModel ? config.fastModel || config.defaultModel : config.defaultModel,
    imagePayloadType: config.imagePayloadType || "image_url"
  });
}

