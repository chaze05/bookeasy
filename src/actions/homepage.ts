"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";

async function assertSuperadmin() {
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

function bust() {
  revalidatePath("/");
  revalidatePath("/superadmin/homepage");
}

export async function updateSectionContent(id: string, content: object) {
  await assertSuperadmin();
  await prisma.homepageConfig.update({
    where: { id },
    data: { content, updated_at: new Date() },
  });
  bust();
}

export async function toggleSectionActive(id: string, is_active: boolean) {
  await assertSuperadmin();
  await prisma.homepageConfig.update({
    where: { id },
    data: { is_active, updated_at: new Date() },
  });
  bust();
}

export async function moveSectionUp(id: string) {
  await assertSuperadmin();
  const sections = await prisma.homepageConfig.findMany({
    orderBy: { order_index: "asc" },
  });
  const idx = sections.findIndex((s) => s.id === id);
  if (idx <= 0) return;
  const current = sections[idx];
  const above = sections[idx - 1];
  await Promise.all([
    prisma.homepageConfig.update({
      where: { id: current.id },
      data: { order_index: above.order_index },
    }),
    prisma.homepageConfig.update({
      where: { id: above.id },
      data: { order_index: current.order_index },
    }),
  ]);
  bust();
}

export async function moveSectionDown(id: string) {
  await assertSuperadmin();
  const sections = await prisma.homepageConfig.findMany({
    orderBy: { order_index: "asc" },
  });
  const idx = sections.findIndex((s) => s.id === id);
  if (idx >= sections.length - 1) return;
  const current = sections[idx];
  const below = sections[idx + 1];
  await Promise.all([
    prisma.homepageConfig.update({
      where: { id: current.id },
      data: { order_index: below.order_index },
    }),
    prisma.homepageConfig.update({
      where: { id: below.id },
      data: { order_index: current.order_index },
    }),
  ]);
  bust();
}

export async function deleteHomepageSection(id: string) {
  await assertSuperadmin();
  await prisma.homepageConfig.delete({ where: { id } });
  bust();
}

export async function createHomepageSection(data: {
  section_key: string;
  content: object;
  order_index: number;
}) {
  await assertSuperadmin();
  await prisma.homepageConfig.create({
    data: {
      section_key: data.section_key,
      content: data.content,
      is_active: true,
      order_index: data.order_index,
    },
  });
  bust();
}
