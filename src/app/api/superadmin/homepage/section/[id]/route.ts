import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

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

function errResponse(msg: string) {
  const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 400;
  return NextResponse.json({ error: msg }, { status });
}

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/superadmin/homepage/section/:id
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await assertSuperadmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      content?: object;
      is_active?: boolean;
      order_index?: number;
    };
    const section = await prisma.homepageConfig.update({
      where: { id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        ...(body.order_index !== undefined && { order_index: body.order_index }),
        updated_at: new Date(),
      },
    });
    revalidatePath("/");
    return NextResponse.json({ section: serialize(section) });
  } catch (e) {
    return errResponse(e instanceof Error ? e.message : "Server error");
  }
}

// DELETE /api/superadmin/homepage/section/:id
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await assertSuperadmin();
    const { id } = await context.params;
    await prisma.homepageConfig.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (e) {
    return errResponse(e instanceof Error ? e.message : "Server error");
  }
}
