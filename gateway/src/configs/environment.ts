import { z } from "zod";

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  AUTH_SERVICE_URL: z.string().url().default("http://auth-service:3001"),
  USERS_SERVICE_URL: z.string().url().default("http://users-service:3002"),
  NOTES_SERVICE_URL: z.string().url().default("http://notes-service:3003"),
  CORS_ORIGIN: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().default("dev-access-secret"),
});

export const env = EnvSchema.parse(process.env);

export const isDevelopment = (): boolean => env.NODE_ENV === "development";

export const isProduction = (): boolean => env.NODE_ENV === "production";

export const getCorsOrigins = (): string[] | boolean => {
  if (!env.CORS_ORIGIN) return true;
  return env.CORS_ORIGIN.split(",").map((origin: string) => origin.trim());
};
