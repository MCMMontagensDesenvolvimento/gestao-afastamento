import { env } from "../../../config/env.js";
import type {
  ApdataContratado,
  ApdataPage,
  ApdataTokenResponse,
} from "./apdata.schema.js";

const TOKEN_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;
const TOKEN_EXPIRY_BUFFER_MS = 30_000;
const DEFAULT_WITH = "cargo,maoObra,folha,situacao,centroCusto,situacoes";

export class ApdataClient {
  private readonly baseUrl = env.APDATA_BASE_URL!.replace(/\/+$/, "");
  private readonly timeoutMs = REQUEST_TIMEOUT_MS;

  private token: string | null = null;
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string> | null = null;

  private readonly apiOrigin: string;

  constructor() {
    this.apiOrigin = new URL(this.baseUrl).origin;
  }

  private async accessToken(forceRefresh = false): Promise<string> {
    if (forceRefresh) {
      this.token = null;
      this.tokenExpiresAt = 0;
    }

    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this.fetchAccessToken();
    console.info("[APDATA] Solicitando token OAuth");

    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchAccessToken(): Promise<string> {
    if (!env.APDATA_CLIENT_ID || !env.APDATA_CLIENT_SECRET) {
      throw new Error("Credenciais APDATA não configuradas.");
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: env.APDATA_CLIENT_ID,
        client_secret: env.APDATA_CLIENT_SECRET,
        scope: "",
      }),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      console.error("[APDATA] Falha no OAuth", {
        url: `${this.baseUrl}/oauth/token`,
        status: response.status,
        body: responseBody.slice(0, 1000),
      });

      throw new Error(`Falha na autenticação APDATA: HTTP ${response.status}`);
    }
    const body = (await response.json()) as ApdataTokenResponse;

    if (typeof body.access_token !== "string" || !body.access_token) {
      throw new Error("A APDATA não retornou access_token.");
    }

    this.token = body.access_token;

    // Se expires_in não for informado, reutiliza o token até
    // que a API indique sua expiração por meio de HTTP 401.
    this.tokenExpiresAt =
      typeof body.expires_in === "number" &&
      Number.isFinite(body.expires_in) &&
      body.expires_in > 0
        ? Date.now() + body.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS
        : Number.POSITIVE_INFINITY;

    return this.token;
  }

  private async request<T>(url: URL, userIdBaseSigob: string): Promise<T> {
    if (url.origin !== this.apiOrigin) {
      throw new Error("A URL da requisição APDATA possui uma origem inválida.");
    }

    const execute = async (token: string) => {
      const inicio = Date.now();

      try {
        console.info("[APDATA] Iniciando requisição", {
          endpoint: url.pathname,
          page: url.searchParams.get("page"),
          timeoutMs: this.timeoutMs,
        });

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "user-id": userIdBaseSigob,
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        console.info("[APDATA] Resposta recebida", {
          endpoint: url.pathname,
          page: url.searchParams.get("page"),
          status: response.status,
          duracaoMs: Date.now() - inicio,
        });

        return response;
      } catch (error) {
        console.error("[APDATA] Falha na requisição", {
          endpoint: url.pathname,
          page: url.searchParams.get("page"),
          duracaoMs: Date.now() - inicio,
          timeoutMs: this.timeoutMs,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };

    let token = await this.accessToken();
    let response = await execute(token);

    if (response.status === 401) {
      token = await this.accessToken(true);
      response = await execute(token);
    }

    if (!response.ok) {
      const body = await response.text();

      console.error("[APDATA] Erro na consulta", {
        endpoint: url.pathname,
        page: url.searchParams.get("page"),
        status: response.status,
        resposta: body.slice(0, 3000),
      });

      throw new Error(
        `Falha na consulta APDATA: HTTP ${response.status} na página ${
          url.searchParams.get("page") ?? "desconhecida"
        }`,
      );
    }

    return (await response.json()) as T;
  }

  async listarContratados(
    userIdBaseSigob: string,
    apenasAtivos = true,
  ): Promise<ApdataContratado[]> {
    if (!userIdBaseSigob.trim()) {
      throw new Error("O user-id do SIGOB é obrigatório.");
    }
    const endpoint = apenasAtivos
      ? "contratados/afastados-com-historico"
      : "contratados";

    const url = new URL(`/api/apdata/${endpoint}`, `${this.baseUrl}/`);

    url.searchParams.set("with", DEFAULT_WITH);
    url.searchParams.set("page", "1");

    const resultado: ApdataContratado[] = [];
    const visitedPages = new Set<string>();

    let nextUrl: URL | null = url;

    while (nextUrl !== null) {
      const currentUrl: URL = nextUrl;

      if (visitedPages.has(currentUrl.href)) {
        throw new Error("A paginação da APDATA retornou uma URL repetida.");
      }

      visitedPages.add(currentUrl.href);

      const body = await this.request<ApdataPage<ApdataContratado>>(
        currentUrl,
        userIdBaseSigob,
      );

      if (!body || !Array.isArray(body.data)) {
        throw new Error("Formato de resposta inesperado do APDATA.");
      }
     
      resultado.push(...body.data);

      if (body.next_page_url === null) {
        nextUrl = null;
        continue;
      }

      if (typeof body.next_page_url !== "string" || !body.next_page_url) {
        throw new Error("URL de paginação inválida retornada pela APDATA.");
      }

      nextUrl = new URL(body.next_page_url, currentUrl);

      if (nextUrl.origin !== this.apiOrigin) {
        throw new Error("A APDATA retornou uma URL de paginação externa.");
      }
    }

    return resultado;
  }

  async listarAfastados(userIdBaseSigob: string): Promise<ApdataContratado[]> {
    const colaboradores = await this.listarContratados(userIdBaseSigob, false);

    return colaboradores.filter(
      (colaborador) => colaborador.FOL_D1sFolha === "MEN - AFASTADOS",
    );
  }
}
