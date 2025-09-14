import compression from "compression";
import cors from "cors";
import { randomUUID } from "crypto";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import pinoHttp from "pino-http";
import { z } from "zod";
import { limiter } from "./configs/limiter";
import { logger } from "./configs/logger";
import { commonProxyOptions } from "./configs/proxy";
import { authMiddleware } from "./middlewares/auth";
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  AUTH_SERVICE_URL: z.string().url().default("http://auth-service:3001"),
  USERS_SERVICE_URL: z.string().url().default("http://users-service:3002"),
  NOTES_SERVICE_URL: z.string().url().default("http://notes-service:3003"),
  CORS_ORIGIN: z.string().optional(),
});
const env = EnvSchema.parse(process.env);

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const httpLogger = pinoHttp({
  logger,
  genReqId(req: express.Request) {
    const existing = (req.headers["x-request-id"] || req.headers["x-correlation-id"]) as string | undefined;
    return existing || randomUUID();
  },
});
app.use(httpLogger);
if (env.NODE_ENV !== "development") {
  // app.use(morgan("dev"));
  app.use(limiter);
}

app.use(helmet()); // set security headers
app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((s: string) => s.trim()) : true,
    credentials: true,
  })
);
app.use(compression());

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "ok" });
});

app.get("/ready", (_req, res) => {
  res.status(200).json({ message: "ready" });
});

app.use("/auth", createProxyMiddleware({
  target: env.AUTH_SERVICE_URL,
  ...commonProxyOptions,
}));

app.use("/notes", authMiddleware, createProxyMiddleware({
  target: env.NOTES_SERVICE_URL,
  ...commonProxyOptions,
}));

app.use("/users", authMiddleware, createProxyMiddleware({
  target: env.USERS_SERVICE_URL,
  ...commonProxyOptions,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// centralized error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal Server Error" });
});

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

// hardened HTTP timeouts
server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;
server.requestTimeout = 30_000;

const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutting down gracefully");
  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
    logger.info("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn("Forcing shutdown after timeout");
    process.exit(1);
  }, 5_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  shutdown("unhandledRejection");
});
