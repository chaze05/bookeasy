import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const businessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "URL slug must be at least 3 characters")
    .max(50, "URL slug must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "URL slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  contact_email: z
    .string()
    .email("Enter a valid contact email")
    .optional()
    .or(z.literal("")),
  currency: z
    .enum(["PHP", "USD", "EUR", "GBP", "AUD", "SGD", "CAD", "JPY", "AED"]),
  timezone: z.string().min(1, "Timezone is required"),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const serviceSchema = z
  .object({
    name: z.string().min(2, "Service name must be at least 2 characters"),
    description: z.string().optional(),
    duration: z.coerce
      .number()
      .int()
      .min(5, "Duration must be at least 5 minutes"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    color: z.string().default("#10b981"),
    party_size_enabled: z
      .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.null()])
      .optional()
      .transform((v) => v === "on" || v === "true" || v === true),
    max_party_size: z.coerce.number().int().min(1).max(100).default(1),
    seats_per_slot: z
      .union([z.coerce.number().int().min(1).max(1000), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v))),
  })
  .refine(
    (data) => !data.party_size_enabled || data.seats_per_slot === null || data.seats_per_slot >= data.max_party_size,
    { message: "Seats per slot must be at least the maximum party size", path: ["seats_per_slot"] }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
