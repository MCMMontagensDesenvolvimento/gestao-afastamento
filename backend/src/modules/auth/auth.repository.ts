import { IdentityProvider as PrismaIdentityProvider, type Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

const authorizationInclude = {
  roles: {
    where: { role: { isActive: true } },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  },
} satisfies Prisma.UserInclude;

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: authorizationInclude });
  }

  findSessionByHash(tokenHash: string) {
    return prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: { include: authorizationInclude } },
    });
  }

  async completeLogin(input: {
    userId: string; subject: string; tenantId: string; email: string; name: string;
    tokenHash: string; expiresAt: Date; requestId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const key = {
        provider: PrismaIdentityProvider.MICROSOFT,
        providerTenantId: input.tenantId,
        providerSubject: input.subject,
      };
      const linked = await tx.externalIdentity.findUnique({ where: { provider_providerTenantId_providerSubject: key } });
      if (linked && linked.userId !== input.userId) return null;

      const now = new Date();
      await tx.externalIdentity.upsert({
        where: { provider_providerTenantId_providerSubject: key },
        update: { emailAtLink: input.email, displayNameAtLink: input.name, lastLoginAt: now },
        create: { userId: input.userId, ...key, emailAtLink: input.email, displayNameAtLink: input.name, lastLoginAt: now },
      });
      await tx.user.update({ where: { id: input.userId }, data: { lastLoginAt: now } });
      const session = await tx.userSession.create({
        data: { userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, lastSeenAt: now },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: input.userId,
          action: "auth.login",
          entityType: "UserSession",
          entityId: session.id,
          requestId: input.requestId,
          metadata: { provider: "MICROSOFT" },
        },
      });
      return session;
    });
  }

  touchSession(id: string, lastSeenAt: Date) {
    return prisma.userSession.updateMany({ where: { id, revokedAt: null }, data: { lastSeenAt } });
  }

  async revokeSession(id: string, userId: string, requestId: string): Promise<void> {
    await prisma.$transaction([
      prisma.userSession.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } }),
      prisma.auditLog.create({ data: { actorUserId: userId, action: "auth.logout", entityType: "UserSession", entityId: id, requestId } }),
    ]);
  }
}
