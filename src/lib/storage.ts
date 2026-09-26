import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

const PAYMENT_PROOF_BUCKET = "payment-proofs";
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function hasValidImageSignature(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (type === "image/gif") {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  }
  if (type === "image/webp") {
    return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

function sanitizePrefix(prefix: string): string {
  const cleaned = prefix.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
  return cleaned || "misc";
}

/**
 * Internal server helper — must NOT be exported from a "use server" module,
 * otherwise any client could invoke it. Uploads are validated by MIME type,
 * magic bytes and size before being written to the public bucket.
 */
export async function uploadPaymentProof(pathPrefix: string, file: File): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Payment proof file is required.");
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    throw new Error("Payment proof must be a JPEG, PNG, WebP or GIF image.");
  }
  if (file.size > MAX_PROOF_SIZE) {
    throw new Error("Payment proof must be 5MB or smaller.");
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!hasValidImageSignature(header, file.type)) {
    throw new Error("Payment proof file is not a valid image.");
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
      allowedMimeTypes: Object.keys(ALLOWED_IMAGE_TYPES),
    });
    if (bucketError) throw bucketError;
  }

  const path = `${sanitizePrefix(pathPrefix)}/proof-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
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
