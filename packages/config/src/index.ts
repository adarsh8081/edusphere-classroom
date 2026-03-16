/**
 * @edusphere/config — Shared Environment Configuration
 *
 * Central config module with Zod validation for env vars.
 */
import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
    PORT: z.string().default("5000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    REDIS_URL: z.string().optional(),
    GOOGLE_GEMINI_API_KEY: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    APP_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate and return typed environment config.
 * Throws if required variables are missing.
 */
export function getConfig(): EnvConfig {
    return envSchema.parse(process.env);
}
