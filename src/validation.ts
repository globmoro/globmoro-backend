import { z } from "zod";
import { MACHINE_INTERESTS } from "./types.js";

export const inquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(1).max(4000),
  machineInterest: z.enum(MACHINE_INTERESTS),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/** Mask PII for logs — never dump full phone/email. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}
