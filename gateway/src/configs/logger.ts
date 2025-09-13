import { mkdirSync } from "fs";
import { join } from "path";
import pino, { stdTimeFunctions } from "pino";

const isProd = process.env.NODE_ENV === "production";
const defaultLevel = isProd ? "info" : "debug";
const logLevel = process.env.LOG_LEVEL || defaultLevel;
const logDir = process.env.LOG_DIR || "logs";
// Create log directory if it doesn't exist
mkdirSync(logDir, { recursive: true });

// Use current date to suffix the log filename: gateway-YYYY-MM-DD.log
const dateSuffix = new Date().toISOString().slice(0, 10);

const targets: any[] = [];

if (!isProd) {
  targets.push({
    target: "pino-pretty",
    level: logLevel,
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  });
}

targets.push({
  target: "pino/file",
  level: logLevel,
  options: {
    destination: join(logDir, `gateway-${dateSuffix}.log`),
  },
});

const transport = pino.transport({ targets });

export const logger = pino(
  {
    name: "gateway",
    level: logLevel,
    base: { service: "gateway", env: process.env.NODE_ENV || "development" },
    timestamp: stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "request.headers.authorization",
        "headers.authorization",
        "req.headers.cookie",
        "request.headers.cookie",
        "password",
        "refreshToken",
        "accessToken",
      ], 
      remove: true,
    },
  },
  transport
);


