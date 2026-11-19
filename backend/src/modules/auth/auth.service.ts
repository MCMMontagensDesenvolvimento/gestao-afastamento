import { createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import type { AuthorizationContext, IdentityProvider } from "../../infrastructure/identity/identity-provider.js";
import { AppError } from "../../shared/errors/app-error.js";
import { normalizeCorporateEmail } from "../../shared/security/email.js";
import type { AuthRepository } from "./auth.repository.js";

export interface LoginFlow extends AuthorizationContext {
  returnTo: string;
  createdAt: number;
}

export interface AuthenticatedPrincipal {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export class AuthService {
  constructor(
    private readonly identityProvider: IdentityProvider,
    private readonly repository: AuthRepository,
  ) {}

  getStatus() {
    return this.identityProvider.getStatus();
  }

  async startLogin(returnTo?: string): Promise<{ url: string; flow: LoginFlow }> {
    const destination = normalizeReturnTo(returnTo);
    const { url, context } = await this.identityProvider.createAuthorizationRequest();
    return { url, flow: { ...context, returnTo: destination, createdAt: Date.now() } };
  }

  async completeLogin(currentUrl: URL, flow: LoginFlow, requestId: string) {
    if (Date.now() - flow.createdAt > 10 * 60_000) {
      throw new AppError(401, "OIDC_FLOW_EXPIRED", "A tentativa de login expirou. Inicie novamente.");
    }
    const identity = await this.identityProvider.completeAuthorization(currentUrl, flow);
    const email = normalizeCorporateEmail(identity.email);
    const user = await this.repository.findUserByEmail(email);
    if (!user?.isActive) throw new AppError(403, "LOCAL_USER_NOT_AUTHORIZED", "O usuário não está ativo nesta aplicação.");

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);
    const session = await this.repository.completeLogin({
      userId: user.id,
      subject: identity.subject,
      tenantId: identity.tenantId,
      email,
      name: identity.name,
      tokenHash: hashToken(token),
      expiresAt,
      requestId,
    });
    if (!session) throw new AppError(409, "EXTERNAL_IDENTITY_ALREADY_LINKED", "A identidade Microsoft já está vinculada a outro usuário.");
    return { token, expiresAt, returnTo: normalizeReturnTo(flow.returnTo) };
  }

  async authenticate(token: string | undefined): Promise<AuthenticatedPrincipal> {
    if (typeof token !== "string" || !token) throw new AppError(401, "AUTHENTICATION_REQUIRED", "É necessário autenticar-se.");
    const session = await this.repository.findSessionByHash(hashToken(token));
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now || !session.user.isActive) {
      throw new AppError(401, "SESSION_INVALID", "A sessão expirou ou foi revogada.");
    }
    if (!session.lastSeenAt || now.getTime() - session.lastSeenAt.getTime() >= env.SESSION_TOUCH_INTERVAL_SECONDS * 1000) {
      await this.repository.touchSession(session.id, now);
    }
    const roles = session.user.roles.map(({ role }) => role.code).sort();
    const permissions = [...new Set(session.user.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)))].sort();
    return { userId: session.user.id, email: session.user.email, name: session.user.name, roles, permissions, sessionId: session.id };
  }

  logout(principal: AuthenticatedPrincipal, requestId: string): Promise<void> {
    return this.repository.revokeSession(principal.sessionId, principal.userId, requestId);
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeReturnTo(value?: string): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })) {
    throw new AppError(422, "INVALID_RETURN_TO", "O destino após login deve ser uma rota interna.");
  }
  const destination = new URL(value, env.FRONTEND_ORIGIN);
  if (destination.origin !== new URL(env.FRONTEND_ORIGIN).origin) {
    throw new AppError(422, "INVALID_RETURN_TO", "O destino após login deve ser uma rota interna.");
  }
  return `${destination.pathname}${destination.search}${destination.hash}`;
}
