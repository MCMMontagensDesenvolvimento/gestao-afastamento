import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

export function normalizeCorporateEmail(value: string): string {
  const email = value.trim().toLowerCase();
  const domain = email.split("@")[1];
  if (!domain || !env.MICROSOFT_ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    throw new AppError(422, "CORPORATE_EMAIL_REQUIRED", "Use um e-mail de domínio corporativo permitido.", [
      { field: "email", message: "Domínio de e-mail não permitido." },
    ]);
  }
  return email;
}
