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
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.startsWith("/login")
    ? value
    : "/";
}
