const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * True when an AI provider key is configured. UI and actions use this to
 * show a friendly "not configured" state instead of failing mid-request.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Server-only text generation via Google Gemini's REST API (free tier
 * friendly). Never import this from a client component — the API key must
 * stay on the server.
 */
export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured yet.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
    throw new Error(`AI request failed: ${detail}`);
  }

  const text =
    body?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  return text;
}
