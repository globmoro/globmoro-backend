import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import type { Inquiry } from "./types.js";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "inquiries.jsonl");

const memory: Inquiry[] = [];

export async function saveInquiry(inquiry: Inquiry): Promise<void> {
  memory.push(inquiry);
  try {
    await mkdir(dataDir, { recursive: true });
    await appendFile(storePath, `${JSON.stringify(inquiry)}\n`, "utf8");
  } catch (err) {
    // Memory still holds the record; file write is best-effort for v1.
    console.error("inquiry_file_write_failed", {
      id: inquiry.id,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export function inquiryCount(): number {
  return memory.length;
}
