import { supabase } from "@/supabase/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("keep_alive")
    .select("id")
    .limit(1);

  return Response.json({
    success: !error,
    data,
    error: error?.message ?? null,
    timestamp: new Date().toISOString(),
  });
}