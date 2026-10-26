"use server";

import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateText, isAiConfigured } from "@/lib/ai";

const MAX_GENERATIONS_PER_HOUR = 30;

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
