export type ApdataContratado = Record<string, unknown>;
export type ApdataCargo = Record<string, unknown>;

export interface ApdataPage<T> {
  data: T[];
  next_page_url: string | null;
}

export interface ApdataTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export interface ApdataClientOptions {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  timeoutMs?: number;
}

export interface ApdataListarContratadosOptions {
  userIdBaseSigob: string;
  apenasAtivos?: boolean;
}

