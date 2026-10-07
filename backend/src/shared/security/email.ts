import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { parseCorporateEmail } from "./corporate-email.js";

export function normalizeCorporateEmail(value: string): string {
  const email = parseCorporateEmail(value, env.MICROSOFT_ALLOWED_EMAIL_DOMAINS);
  if (!email) {
    throw new AppError(422, "CORPORATE_EMAIL_REQUIRED", "Use um e-mail de domínio corporativo permitido.", [
      { field: "email", message: "Informe um e-mail válido de domínio corporativo permitido." },
    ]);
  }
  return email;
}
