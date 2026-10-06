import { ApiError } from "./errors";
import type { Params } from "./types";

export const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] || "/api/v1").replace(/\/$/, "");
if (!/^(?:https?:\/\/[^/?#]+)?\/api\/v1$/.test(API_BASE_URL)) {
  throw new Error("VITE_API_BASE_URL deve apontar para /api/v1.");
}

export function withParams(path: string, params: Params = {}): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return `${path}${query.size ? `?${query}` : ""}`;
}

let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request(path: string, options: RequestInit): Promise<Response> {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.split("?")[0]!.split("/").includes("..")
  ) {
    throw new Error("O endpoint deve ser um caminho interno da API.");
  }
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Falha de conexão. Verifique sua rede e tente novamente.",
    );
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const error = new ApiError(
      response.status,
      typeof payload["code"] === "string" ? payload["code"] : "HTTP_ERROR",
      typeof payload["message"] === "string"
        ? payload["message"]
        : response.status === 403
          ? "Você não possui permissão para esta operação."
          : "O serviço está indisponível. Tente novamente em instantes.",
      typeof payload["requestId"] === "string"
        ? payload["requestId"]
        : (response.headers.get("x-request-id") ?? undefined),
      Array.isArray(payload["fieldErrors"])
        ? payload["fieldErrors"].filter(
            (item): item is { field: string; message: string } =>
              item && typeof item.field === "string" && typeof item.message === "string",
          )
        : undefined,
    );
    if (response.status === 401 && path !== "/auth/me") onUnauthorized?.();
    throw error;
  }
  return response;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await request(path, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  return (await request(path, options)).blob();
}
