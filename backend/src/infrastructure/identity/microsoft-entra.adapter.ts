import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type Configuration,
} from "openid-client";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  AuthorizationContext,
  ExternalIdentityClaims,
  IdentityProvider,
  IdentityProviderStatus,
} from "./identity-provider.js";

export class MicrosoftEntraAdapter implements IdentityProvider {
  private configuration?: Promise<Configuration>;
  private readonly configured = Boolean(
    env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_IDS.length > 0,
  );

  getStatus(): IdentityProviderStatus {
    return { provider: "MICROSOFT", configured: this.configured };
  }

  async createAuthorizationRequest(): Promise<{ url: string; context: AuthorizationContext }> {
    const configuration = await this.getConfiguration();
    const context = { state: randomState(), nonce: randomNonce(), codeVerifier: randomPKCECodeVerifier() };
    const codeChallenge = await calculatePKCECodeChallenge(context.codeVerifier);
    const url = buildAuthorizationUrl(configuration, {
      redirect_uri: env.MICROSOFT_REDIRECT_URI,
      scope: "openid profile email",
      response_type: "code",
      response_mode: "query",
      state: context.state,
      nonce: context.nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    return { url: url.toString(), context };
  }

  async completeAuthorization(currentUrl: URL, context: AuthorizationContext): Promise<ExternalIdentityClaims> {
    const tokens = await authorizationCodeGrant(await this.getConfiguration(), currentUrl, {
      expectedState: context.state,
      expectedNonce: context.nonce,
      pkceCodeVerifier: context.codeVerifier,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    const tenantId = stringClaim(claims?.tid);
    const subject = stringClaim(claims?.oid) ?? stringClaim(claims?.sub);
    const email = stringClaim(claims?.preferred_username) ?? stringClaim(claims?.email);
    const name = stringClaim(claims?.name) ?? email;

    if (!tenantId || !subject || !email || !name) {
      throw new AppError(401, "MICROSOFT_IDENTITY_INCOMPLETE", "A identidade Microsoft não contém os dados obrigatórios.");
    }
    if (!env.MICROSOFT_TENANT_IDS.includes(tenantId)) {
      throw new AppError(403, "MICROSOFT_TENANT_NOT_ALLOWED", "O tenant Microsoft não está autorizado.");
    }
    return { tenantId, subject, email, name };
  }

  private getConfiguration(): Promise<Configuration> {
    if (!this.configured || !env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
      throw new AppError(503, "IDENTITY_PROVIDER_NOT_CONFIGURED", "A autenticação Microsoft ainda não foi configurada neste ambiente.");
    }
    this.configuration ??= discovery(
      new URL(`https://login.microsoftonline.com/${encodeURIComponent(env.MICROSOFT_TENANT_IDS[0]!)}/v2.0`),
      env.MICROSOFT_CLIENT_ID,
      env.MICROSOFT_CLIENT_SECRET,
    );
    return this.configuration;
  }
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
