import { api, API_BASE_URL, withParams } from "@/lib/api/client";
import type { ResponseData } from "@/lib/api/types";

export interface Session {
  user: { id: string; email: string; name: string };
  roles: string[];
  permissions: string[];
}

export const authService = {
  me: async () => (await api<ResponseData<Session>>("/auth/me")).data,
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  loginUrl: (returnTo = "/") =>
    `${API_BASE_URL}${withParams("/auth/login", { returnTo: safeReturnTo(returnTo) })}`,
};

export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return "/";

  const target = new URL(value, window.location.origin);
  if (target.origin !== window.location.origin || target.pathname.startsWith("/login")) return "/";
  return `${target.pathname}${target.search}${target.hash}`;
}
