import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "node:crypto";
import { inquirySchema, maskEmail, maskPhone } from "./validation.js";
import { saveInquiry, inquiryCount } from "./store.js";
import type { Inquiry } from "./types.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 10);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

async function main() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  await app.register(cors, {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST", "OPTIONS"],
  });

  await app.register(rateLimit, {
    global: false,
  });

  app.get("/health", async () => ({
    ok: true,
    service: "globmoro-backend",
  }));

  app.post(
    "/api/inquiries",
    {
      config: {
        rateLimit: {
          max: RATE_LIMIT_MAX,
          timeWindow: RATE_LIMIT_WINDOW_MS,
        },
      },
    },
    async (request, reply) => {
      const parsed = inquirySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "validation_failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const body = parsed.data;
      const inquiry: Inquiry = {
        id: randomUUID(),
        ...body,
        createdAt: new Date().toISOString(),
      };

      await saveInquiry(inquiry);

      request.log.info(
        {
          inquiryId: inquiry.id,
          machineInterest: inquiry.machineInterest,
          email: maskEmail(inquiry.email),
          phone: maskPhone(inquiry.phone),
          total: inquiryCount(),
        },
        "inquiry_received"
      );

      return reply.status(201).send({
        ok: true,
        id: inquiry.id,
      });
    }
  );

  await app.listen({ port: PORT, host: HOST });
  app.log.info({ port: PORT, cors: CORS_ORIGINS }, "globmoro-backend listening");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
