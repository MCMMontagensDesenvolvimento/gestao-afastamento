import { env } from "../../config/env.js";
import type { Cargo } from "./cargos.schema.js";
import { AppError } from "../../shared/errors/app-error.js";

const REQUEST_TIMEOUT_MS = 60_000;

export class CargoClient {
  private get baseUrl(): string {
    if (!env.APDATA_BASE_URL) {
      throw new AppError(
        503,
        "APDATA_NOT_CONFIGURED",
        "A integração com o ApData ainda não está configurada.",
      );
    }

    return env.APDATA_BASE_URL.replace(/\/+$/, "");
  }

  async listarCargos(): Promise<Cargo[]> {
    const url = `${this.baseUrl}/cargos`;

    try {
      console.info("[APDATA] Consultando cargos");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text();

        console.error("[APDATA] Falha ao consultar cargos", {
          status: response.status,
          body: body.slice(0, 1000),
        });

        throw new Error(
          `Falha ao consultar cargos: HTTP ${response.status}`,
        );
      }

      const resultado: unknown = await response.json();

      if (!Array.isArray(resultado) || !resultado.every(isCargo)) {
        throw new AppError(
          502,
          "APDATA_INVALID_RESPONSE",
          "Formato de resposta de cargos invalido.",
        );
      }

      console.info("[APDATA] Cargos consultados com sucesso");

      return resultado;
    } catch (error) {
      console.error("[APDATA] Erro na consulta de cargos", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}

function isCargo(value: unknown): value is Cargo {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const cargo = value as Record<string, unknown>;

  return (
    typeof cargo["id"] === "number" &&
    typeof cargo["codigo"] === "string" &&
    typeof cargo["descricao"] === "string"
  );
}
