import { z } from "zod";

/** Sem dependência do ambiente HTTP: também usado pelo bootstrap via CLI. */
export function parseCorporateEmail(value: string, allowedDomains: readonly string[]): string | undefined {
  const email = value.trim().toLowerCase();
  if (!z.email().max(320).safeParse(email).success) return undefined;
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return allowedDomains.includes(domain) ? email : undefined;
}
