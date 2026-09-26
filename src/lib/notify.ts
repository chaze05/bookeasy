import { headers } from "next/headers";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/**
 * Resolves where owner-facing booking notifications should go:
 * business.contact_email when set, otherwise the owner's auth email.
 */
export async function getBusinessNotificationEmail(businessId: string): Promise<string | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { contact_email: true, owner_id: true },
  });
  if (!business) return null;
  if (business.contact_email) return business.contact_email;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !business.owner_id) return null;

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.getUserById(business.owner_id);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

/** Absolute base URL of the running app (env override, then request headers). */
export async function getAppBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return "http://localhost:3000";
  const proto =
    headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
