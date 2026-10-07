import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";
import { mutateAdministrativeAccess } from "../access/administrative-access.repository.js";

const publicInclude = {
  roles: { include: { role: { select: { id: true, code: true, name: true, isActive: true } } } },
  externalIdentities: { select: { provider: true, providerTenantId: true, linkedAt: true, lastLoginAt: true } },
} satisfies Prisma.UserInclude;

export class UsersRepository {
  async list(input: { page: number; perPage: number; search?: string | undefined; ativo?: boolean | undefined; roleId?: string | undefined }) {
    const where: Prisma.UserWhereInput = {
      ...(input.search ? { OR: [
        { name: { contains: input.search, mode: "insensitive" } },
        { email: { contains: input.search, mode: "insensitive" } },
      ] } : {}),
      ...(input.ativo === undefined ? {} : { isActive: input.ativo }),
      ...(input.roleId ? { roles: { some: { roleId: input.roleId } } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({ where, include: publicInclude, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (input.page - 1) * input.perPage, take: input.perPage }),
      prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string) { return prisma.user.findUnique({ where: { id }, include: publicInclude }); }
  findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); }
  create(data: { name: string; email: string; isActive: boolean }) { return prisma.user.create({ data }); }
  update(id: string, data: { name?: string | undefined }) { return prisma.user.update({ where: { id }, data: data.name === undefined ? {} : { name: data.name } }); }
  setActive(id: string, isActive: boolean) {
    return mutateAdministrativeAccess(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { isActive } });
      if (!isActive) await tx.userSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return user;
    });
  }
  async replaceRoles(userId: string, roleIds: string[], assignedById: string) {
    return mutateAdministrativeAccess(async (tx) => {
      const count = await tx.role.count({ where: { id: { in: roleIds }, isActive: true } });
      if (count !== roleIds.length) return null;
      await tx.userRole.deleteMany({ where: { userId } });
      if (roleIds.length) await tx.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId, assignedById })) });
      return tx.user.findUnique({ where: { id: userId }, include: publicInclude });
    });
  }
}
