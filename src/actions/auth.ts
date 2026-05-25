"use server";

import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

// Called immediately after signInWithPassword on the client — reads the
// fresh session from cookies and returns the profile role so the login
// page can redirect to the correct area without a client-side DB query.
export async function getSessionRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return (profile?.role as UserRole) ?? "owner";
}
