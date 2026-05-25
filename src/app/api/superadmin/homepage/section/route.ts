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

// GET /api/superadmin/homepage/section — all sections (incl. inactive)
export async function GET() {
  try {
    await assertSuperadmin();
    const sections = await prisma.homepageConfig.findMany({
      orderBy: { order_index: "asc" },
    });
    return NextResponse.json({ sections: serialize(sections) });
  } catch (e) {
    return errResponse(e instanceof Error ? e.message : "Server error");
  }
}

// POST /api/superadmin/homepage/section — create section
export async function POST(request: NextRequest) {
  try {
    await assertSuperadmin();
    const body = (await request.json()) as {
      section_key?: string;
      content?: object;
      is_active?: boolean;
      order_index?: number;
    };
    if (!body.section_key || !body.content) {
      return NextResponse.json({ error: "section_key and content are required" }, { status: 400 });
    }
    const section = await prisma.homepageConfig.create({
      data: {
        section_key: body.section_key,
        content: body.content,
        is_active: body.is_active ?? true,
        order_index: body.order_index ?? 0,
      },
    });
    revalidatePath("/");
    return NextResponse.json({ section: serialize(section) }, { status: 201 });
  } catch (e) {
    return errResponse(e instanceof Error ? e.message : "Server error");
  }
}
