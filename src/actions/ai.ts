"use server";

import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateText, isAiConfigured } from "@/lib/ai";

const MAX_GENERATIONS_PER_HOUR = 30;

const HOMEPAGE_SECTION_PROMPTS: Record<string, string> = {
  features: "a features section introducing a booking platform",
  pricing: "a pricing section for booking software with simple PHP peso plans",
  cta: "the closing call-to-action inviting businesses to get started",
  social_proof: "a trust/social-proof section for a booking platform",
};

async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== "superadmin") throw new Error("Forbidden");
}

/**
 * Drafts a service description from the service name/duration/price.
 * Owner-only, rate-limited, and sends no customer data to the AI provider.
 */
export async function generateServiceDescription(formData: FormData): Promise<{ text: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true, name: true, currency: true },
  });
  if (!business) throw new Error("No business found");

  if (!isAiConfigured()) {
    throw new Error("AI is not configured yet. Add GEMINI_API_KEY to enable this.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const duration = Number(formData.get("duration") ?? 0);
  const price = Number(formData.get("price") ?? 0);
  if (name.length < 2) throw new Error("Enter a service name first.");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.aiGeneration.count({
    where: { business_id: business.id, created_at: { gte: oneHourAgo } },
  });
  if (recent >= MAX_GENERATIONS_PER_HOUR) {
    throw new Error("AI limit reached for this hour. Please try again later.");
  }

  const prompt = [
    "Write a short, appealing service description for an online booking page.",
    `Business: ${business.name}.`,
    `Service: ${name}.`,
    duration > 0 ? `Duration: ${duration} minutes.` : "",
    price > 0 ? `Price: ${business.currency} ${price}.` : "",
    "Requirements: 1-2 sentences, at most 220 characters, friendly and concrete, no emojis, no quotation marks, do not invent awards, guarantees or customer numbers.",
  ]
    .filter(Boolean)
    .join("\n");

  const text = await generateText(prompt);
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/^["']|["']$/g, "")
    .slice(0, 300);

  await prisma.aiGeneration.create({ data: { business_id: business.id } });
  await prisma.aiGeneration
    .deleteMany({
      where: { business_id: business.id, created_at: { lt: new Date(Date.now() - 7 * 86_400_000) } },
    })
    .catch(() => {});

  return { text: cleaned };
}

/**
 * Drafts heading + subheading copy for a homepage section (superadmin only).
 * Existing copy is not touched until the editor applies it.
 */
export async function generateHomepageCopy(
  formData: FormData
): Promise<{ heading: string; subheading: string }> {
  await requireSuperadmin();
  if (!isAiConfigured()) {
    throw new Error("AI is not configured yet. Add GEMINI_API_KEY to enable this.");
  }

  const sectionKey = String(formData.get("section_key") ?? "").trim();
  const purpose = HOMEPAGE_SECTION_PROMPTS[sectionKey];
  if (!purpose) throw new Error("AI copy is not available for this section.");

  const brief = String(formData.get("brief") ?? "").trim().slice(0, 200);

  const prompt = [
    "You write short marketing copy for BookEasy, a booking platform for service businesses in the Philippines (salons, clinics, pickleball courts, restaurants, events venues).",
    `Write copy for ${purpose}.`,
    brief ? `Extra direction from the editor: ${brief}` : "",
    "Return ONLY valid JSON in this exact shape: {\"heading\": string, \"subheading\": string}.",
    "Rules: heading max 60 characters; subheading max 160 characters; confident, concrete, friendly; no emojis; no quotation marks; no invented statistics, awards or guarantees.",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await generateText(prompt);

  let parsed: { heading?: unknown; subheading?: unknown } | null = null;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed) throw new Error("AI returned an unexpected format. Please try again.");

  const heading = String(parsed.heading ?? "").trim().slice(0, 80);
  const subheading = String(parsed.subheading ?? "").trim().slice(0, 200);
  if (!heading) throw new Error("AI did not return usable copy. Please try again.");

  return { heading, subheading };
}
