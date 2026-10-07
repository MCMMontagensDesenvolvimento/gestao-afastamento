import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

const usableAdministrator: Prisma.UserWhereInput = {
  isActive: true,
  AND: ["session.access", "permissions.manage"].map((code) => ({
    roles: { some: { role: { isActive: true, permissions: { some: { permission: { code } } } } } },
  })),
};

class LastAdministratorConflict extends Error {}

export type AdministrativeMutation<T> = { changed: true; value: T } | { changed: false };

/** Serializa somente as mutações de acesso que podem remover o último administrador. */
export async function mutateAdministrativeAccess<T>(
  mutation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<AdministrativeMutation<T>> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Mesmo lock transacional entre alterações de papéis, capabilities e usuários.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(746013571)`;
      const hadAdministrator = (await tx.user.count({ where: usableAdministrator })) > 0;
      const value = await mutation(tx);
      if (hadAdministrator && !(await tx.user.count({ where: usableAdministrator }))) {
        throw new LastAdministratorConflict();
      }
      return { changed: true as const, value };
    });
  } catch (error) {
    if (error instanceof LastAdministratorConflict) return { changed: false };
    throw error;
  }
}
