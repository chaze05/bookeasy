import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sections = await prisma.homepageConfig.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
      select: { id: true, section_key: true, content: true, order_index: true },
    });
    return NextResponse.json({ sections: serialize(sections) });
  } catch {
    return NextResponse.json({ sections: [] });
  }
}
