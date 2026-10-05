import { z } from "zod";
import { ALL_SIZES } from "./types";

/** Shared between the checkout form (client) and /api/orders (server). */
export const orderInput = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(160),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number")),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(191)]).default(""),
  address: z.string().trim().min(8, "Enter your full delivery address").max(1000),
  city: z.string().trim().max(100).default(""),
  zone: z.enum(["inside", "outside"]),
  note: z.string().trim().max(1000).default(""),
  payment: z.string().trim().min(1).max(20),
  lines: z
    .array(z.object({ slug: z.string().min(1).max(120), size: z.enum(ALL_SIZES as [string, ...string[]]), qty: z.number().int().min(1).max(10) }))
    .min(1, "Your bag is empty")
    .max(50),
});
export type OrderInput = z.infer<typeof orderInput>;

export const subscribeInput = z.object({ email: z.string().trim().toLowerCase().email().max(191) });
