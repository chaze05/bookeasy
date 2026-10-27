import { isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * Lists the Gemini models available to the configured API key.
 * Model identifiers are not sensitive; the API key is never returned.
 */
export async function GET() {
  if (!isAiConfigured()) {
    return Response.json({ configured: false, models: [] });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}&pageSize=200`,
    { signal: AbortSignal.timeout(15000) }
  );
  const body = (await response.json().catch(() => null)) as {
    models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    return Response.json({
      configured: true,
      status: response.status,
      error: body?.error?.message ?? "Failed to list models",
    });
  }

  const models = (body?.models ?? [])
    .filter((model) => (model.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((model) => (model.name ?? "").replace(/^models\//, ""))
    .filter(Boolean);

  return Response.json({ configured: true, count: models.length, models });
}
