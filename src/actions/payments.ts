"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export type PaymentType = "stripe" | "gcash" | "maya" | "wise" | "bank_transfer" | "cash";
const PAYMENT_PROOF_BUCKET = "payment-proofs";
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

export interface PaymentMethodConfig {
  id?: string;
  business_id: string;
  type: PaymentType;
  label: string;
  is_enabled: boolean;
  details: Record<string, string>;
  sort_order: number;
}

async function assertSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== "superadmin") throw new Error("Forbidden");
}

async function assertBusinessOwner(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const business = await prisma.business.findFirst({
    where: { id: businessId, owner_id: user.id },
    select: { id: true },
  });
  if (!business) throw new Error("Forbidden");
}

async function getOwnedBusiness() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");
  return business;
}

export async function getBusinessPaymentMethods(businessId: string) {
  const methods = await prisma.paymentMethod.findMany({
    where: { business_id: businessId, is_enabled: true },
    orderBy: { sort_order: "asc" },
  });
  return serialize(methods) as PaymentMethodConfig[];
}

export async function getAllPaymentMethodsAdmin() {
  await assertSuperadmin();
  const methods = await prisma.paymentMethod.findMany({
    orderBy: [{ business_id: "asc" }, { sort_order: "asc" }],
    include: { business: { select: { name: true, slug: true } } },
  });
  return serialize(methods);
}

export async function upsertPaymentMethod(data: PaymentMethodConfig) {
  await assertBusinessOwner(data.business_id);

  if (data.id) {
    await prisma.paymentMethod.update({
      where: { id: data.id },
      data: {
        label: data.label,
        is_enabled: data.is_enabled,
        details: data.details,
        sort_order: data.sort_order,
        updated_at: new Date(),
      },
    });
  } else {
    await prisma.paymentMethod.create({
      data: {
        business_id: data.business_id,
        type: data.type,
        label: data.label,
        is_enabled: data.is_enabled,
        details: data.details,
        sort_order: data.sort_order,
      },
    });
  }
  revalidatePath("/dashboard/settings");
}

export async function deletePaymentMethod(id: string, businessId: string) {
  await assertBusinessOwner(businessId);
  await prisma.paymentMethod.delete({ where: { id } });
  revalidatePath("/dashboard/settings");
}

export async function ownerUpdatePaymentMethod(formData: FormData) {
  const business = await getOwnedBusiness();
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "") as PaymentType;
  const label = String(formData.get("label") ?? "").trim();
  const isEnabled = formData.get("is_enabled") === "on";
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!type || !label) throw new Error("Payment method is incomplete");

  const detailKeys = getPaymentDetailKeys(type);
  const details: Record<string, string> = Object.fromEntries(
    detailKeys
      .map((key) => [key, String(formData.get(key) ?? "").trim()])
      .filter(([, value]) => value)
  );
  const qrImage = formData.get("qr_image_file");
  if (qrImage instanceof File && qrImage.size > 0) {
    details.qr_image_url = await uploadPaymentProof(`payment-qr-${business.id}-${type}`, qrImage);
  }

  if (id) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { id, business_id: business.id },
      select: { id: true },
    });
    if (!existing) throw new Error("Payment method not found");
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        label,
        is_enabled: isEnabled,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        details,
        updated_at: new Date(),
      },
    });
  } else {
    await prisma.paymentMethod.create({
      data: {
        business_id: business.id,
        type,
        label,
        is_enabled: isEnabled,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        details,
      },
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function submitSubscriptionPayment(formData: FormData) {
  const business = await getOwnedBusiness();
  const paymentMethodType = String(formData.get("payment_method_type") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const proof = formData.get("payment_proof");

  if (!paymentMethodType) throw new Error("Please select a payment method.");
  if (!(proof instanceof File) || proof.size === 0) {
    throw new Error("Please upload a payment proof image.");
  }

  const proofUrl = await uploadPaymentProof(`subscription-${business.id}-${crypto.randomUUID()}`, proof);

  await prisma.subscriptionPayment.create({
    data: {
      business_id: business.id,
      payment_method_type: paymentMethodType,
      payment_proof_url: proofUrl,
      notes,
    },
  });

  revalidatePath("/dashboard/settings");
}

// Superadmin: toggle a single method by id
export async function adminTogglePaymentMethod(id: string, is_enabled: boolean) {
  await assertSuperadmin();
  await prisma.paymentMethod.update({
    where: { id },
    data: { is_enabled, updated_at: new Date() },
  });
  revalidatePath("/superadmin/payments");
}

// Superadmin: enable/disable a payment type platform-wide (all businesses)
export async function adminTogglePaymentType(type: string, is_enabled: boolean) {
  await assertSuperadmin();
  await prisma.paymentMethod.updateMany({
    where: { type },
    data: { is_enabled, updated_at: new Date() },
  });
  revalidatePath("/superadmin/payments");
}

export async function adminUpdatePaymentMethod(formData: FormData) {
  await assertSuperadmin();

  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const isEnabled = formData.get("is_enabled") === "on";
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!id) throw new Error("Payment method is required");
  if (!label) throw new Error("Label is required");

  const existing = await prisma.paymentMethod.findUnique({
    where: { id },
    select: { type: true },
  });
  if (!existing) throw new Error("Payment method not found");

  const detailKeys = getPaymentDetailKeys(existing.type);
  const details: Record<string, string> = Object.fromEntries(
    detailKeys
      .map((key) => [key, String(formData.get(key) ?? "").trim()])
      .filter(([, value]) => value)
  );
  const qrImage = formData.get("qr_image_file");
  if (qrImage instanceof File && qrImage.size > 0) {
    details.qr_image_url = await uploadPaymentProof(`payment-qr-${id}`, qrImage);
  }

  await prisma.paymentMethod.update({
    where: { id },
    data: {
      label,
      is_enabled: isEnabled,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      details,
      updated_at: new Date(),
    },
  });

  revalidatePath("/superadmin/payments");
}

function getPaymentDetailKeys(type: string) {
  if (type === "cash") {
    return ["instructions"];
  }
  if (type === "gcash" || type === "maya") {
    return ["account_name", "number", "qr_image_url", "app_link", "payment_link"];
  }
  if (type === "wise") {
    return ["account_name", "email", "payment_link", "account_number", "routing_number", "swift_code"];
  }
  if (type === "bank_transfer") {
    return ["bank_name", "account_name", "account_number", "branch", "swift_code", "qr_image_url"];
  }
  return ["publishable_key", "payment_link", "webhook_endpoint"];
}

export async function uploadPaymentProof(pathPrefix: string, file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Payment proof must be an image.");
  }
  if (file.size > MAX_PROOF_SIZE) {
    throw new Error("Payment proof must be 5MB or smaller.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Payment proof upload is not configured.");
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: bucket } = await supabaseAdmin.storage.getBucket(PAYMENT_PROOF_BUCKET);
  if (!bucket) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(PAYMENT_PROOF_BUCKET, {
      public: true,
      fileSizeLimit: MAX_PROOF_SIZE,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (bucketError) throw bucketError;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${pathPrefix}/proof-${Date.now()}.${extension}`;
  const { error } = await supabaseAdmin.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(PAYMENT_PROOF_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
