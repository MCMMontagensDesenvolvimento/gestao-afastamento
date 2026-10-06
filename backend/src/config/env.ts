import "dotenv/config";
import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const csv = z
  .string()
  .default("")
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  FRONTEND_ORIGIN: z.url().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL é obrigatória."),
  SESSION_COOKIE_NAME: z.string().trim().min(1).default("mcm_afastados_session"),
  SESSION_SECRET: optionalText,
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28_800),
  SESSION_TOUCH_INTERVAL_SECONDS: z.coerce.number().int().positive().default(300),
  COOKIE_SECURE: booleanFromString,
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  MICROSOFT_CLIENT_ID: optionalText,
  MICROSOFT_CLIENT_SECRET: optionalText,
  MICROSOFT_TENANT_IDS: csv,
  MICROSOFT_REDIRECT_URI: z.url().default("http://localhost:3000/api/v1/auth/callback"),
  MICROSOFT_ALLOWED_EMAIL_DOMAINS: z
    .string()
    .default("mcm.eng.br,mcmmontagens.com.br")
    .transform((value) => value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))
    .pipe(z.array(z.string().min(1)).min(1)),
  BOOTSTRAP_ADMIN_EMAIL: optionalText,
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_PATH: z.string().trim().min(1).default("/app/storage"),
  S3_ENDPOINT: optionalText,
  S3_REGION: optionalText,
  S3_BUCKET: optionalText,
  S3_ACCESS_KEY_ID: optionalText,
  S3_SECRET_ACCESS_KEY: optionalText,
  S3_FORCE_PATH_STYLE: booleanFromString,
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10_485_760),
}).superRefine((value, context) => {
  const microsoftValues = [value.MICROSOFT_CLIENT_ID, value.MICROSOFT_CLIENT_SECRET];
  const microsoftPartiallyConfigured = microsoftValues.some(Boolean) || value.MICROSOFT_TENANT_IDS.length > 0;
  const microsoftConfigured = microsoftValues.every(Boolean) && value.MICROSOFT_TENANT_IDS.length > 0;

  if (microsoftPartiallyConfigured && !microsoftConfigured) {
    context.addIssue({
      code: "custom",
      path: ["MICROSOFT_CLIENT_ID"],
      message: "A configuração Microsoft deve informar client ID, secret e ao menos um tenant em conjunto.",
    });
  }

  if (microsoftConfigured && !value.SESSION_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["SESSION_SECRET"],
      message: "SESSION_SECRET é obrigatória quando a autenticação Microsoft está configurada.",
    });
  }

  if (value.NODE_ENV === "production" && (!value.SESSION_SECRET || !value.COOKIE_SECURE)) {
    context.addIssue({
      code: "custom",
      path: ["SESSION_SECRET"],
      message: "Produção exige SESSION_SECRET e COOKIE_SECURE=true.",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Configuração de ambiente inválida: ${details}`);
}

export const env = parsed.data;

export type Env = typeof env;
