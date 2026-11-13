import { env } from "../../config/env.js";
import { Cargo } from "./cargos.schema.js";


const REQUEST_TIMEOUT_MS = 60_000;

export class CargoClient {
  private readonly baseUrl = env.APDATA_BASE_URL!.replace(/\/+$/, "");

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

      const resultado = await response.json();

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
