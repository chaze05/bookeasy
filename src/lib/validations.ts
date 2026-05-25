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
  timezone: z.string().default("UTC"),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().optional(),
  duration: z.coerce
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  color: z.string().default("#10b981"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
