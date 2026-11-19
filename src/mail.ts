import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Inquiry } from "./types.js";

const DEFAULT_TO = "Globmoro@gmail.com";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Parse SMTP_* env. Returns null when required fields are missing. */
export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureRaw === undefined || secureRaw === ""
      ? port === 465
      : secureRaw === "1" || secureRaw === "true" || secureRaw === "yes";

  const to = (process.env.INQUIRY_TO_EMAIL ?? DEFAULT_TO).trim() || DEFAULT_TO;
  const from = (process.env.SMTP_FROM ?? user).trim() || user;

  return { host, port, secure, user, pass, from, to };
}

let transporter: Transporter | null = null;
let transporterKey: string | null = null;

function getTransporter(config: SmtpConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (transporter && transporterKey === key) {
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  transporterKey = key;
  return transporter;
}

function escapeText(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

export function buildInquiryMail(inquiry: Inquiry): {
  subject: string;
  text: string;
} {
  const subject = `[Globmoro] Inquiry from ${inquiry.name} — ${inquiry.machineInterest}`;
  const text = [
    "New website inquiry",
    "",
    `Name: ${escapeText(inquiry.name)}`,
    `Company: ${escapeText(inquiry.company)}`,
    `Phone: ${escapeText(inquiry.phone)}`,
    `Email: ${escapeText(inquiry.email)}`,
    `Machine interest: ${inquiry.machineInterest}`,
    `Inquiry id: ${inquiry.id}`,
    `Received at: ${inquiry.createdAt}`,
    "",
    "Message:",
    escapeText(inquiry.message),
  ].join("\n");
  return { subject, text };
}

export type SendInquiryEmailResult =
  | { status: "sent"; messageId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/**
 * Best-effort notification email after the inquiry is already stored.
 * Missing SMTP in non-production → skip + log.
 * Missing SMTP in production → loud error log, still skip (caller returns 201).
 */
export async function sendInquiryEmail(
  inquiry: Inquiry,
  log: {
    info: (obj: object, msg: string) => void;
    error: (obj: object, msg: string) => void;
    warn: (obj: object, msg: string) => void;
  }
): Promise<SendInquiryEmailResult> {
  const config = readSmtpConfig();

  if (!config) {
    const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter(
      (k) => !process.env[k]?.trim()
    );
    if (isProduction()) {
      log.error(
        { missing, inquiryId: inquiry.id },
        "inquiry_email_misconfigured"
      );
    } else {
      log.warn(
        { missing, inquiryId: inquiry.id },
        "inquiry_email_skipped_no_smtp"
      );
    }
    return {
      status: "skipped",
      reason: `missing env: ${missing.join(", ")}`,
    };
  }

  const { subject, text } = buildInquiryMail(inquiry);

  try {
    const info = await getTransporter(config).sendMail({
      from: config.from,
      to: config.to,
      replyTo: inquiry.email,
      subject,
      text,
    });
    log.info(
      {
        inquiryId: inquiry.id,
        to: config.to,
        messageId: info.messageId,
      },
      "inquiry_email_sent"
    );
    return { status: "sent", messageId: info.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "unknown";
    log.error({ inquiryId: inquiry.id, error }, "inquiry_email_failed");
    return { status: "failed", error };
  }
}
