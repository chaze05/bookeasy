export const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";
const FALLBACK_MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.8-flash"];
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * True when an AI provider key is configured. UI and actions use this to
 * show a friendly "not configured" state instead of failing mid-request.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function configuredModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

async function requestModel(model: string, prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  const body = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    const detail = body?.error?.message ?? `HTTP ${response.status}`;
    const error = new Error(`AI request failed: ${detail}`);
    throw Object.assign(error, { retryableModel: response.status === 404 || response.status === 429 || response.status >= 500 || /no longer available|not found|not supported|high demand|overloaded|try again later|resource exhausted/i.test(detail) });
  }

  const text =
    body?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) throw new Error("AI returned an empty response. Please try again.");
  return text;
}

/**
 * Server-only text generation via Google Gemini's REST API (free tier
 * friendly). Never import this from a client component — the API key must
 * stay on the server. If the configured model has been retired by Google,
 * it automatically falls back to a current model.
 */
export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured yet.");
  }

  const primary = configuredModel();
  const models = [primary, ...FALLBACK_MODELS.filter((model) => model !== primary)];

  let lastError: Error = new Error("AI request failed. Please try again.");
  for (const model of models) {
    try {
      return await requestModel(model, prompt, apiKey);
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
      if (!(error as { retryableModel?: boolean }).retryableModel) throw lastError;
    }
  }
  throw lastError;
}
