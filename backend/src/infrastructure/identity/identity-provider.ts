export interface IdentityProviderStatus {
  provider: "MICROSOFT";
  configured: boolean;
}

export interface AuthorizationContext {
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface ExternalIdentityClaims {
  subject: string;
  tenantId: string;
  email: string;
  name: string;
}

export interface IdentityProvider {
  getStatus(): IdentityProviderStatus;
  createAuthorizationRequest(): Promise<{ url: string; context: AuthorizationContext }>;
  completeAuthorization(currentUrl: URL, context: AuthorizationContext): Promise<ExternalIdentityClaims>;
}
