import { prisma } from "../../infrastructure/database/prisma.js";

const include = { permissions: { include: { permission: true } }, _count: { select: { users: true } } } as const;

export class AccessRepository {
  listRoles() { return prisma.role.findMany({ include, orderBy: [{ code: "asc" }, { id: "asc" }] }); }
  listPermissions() { return prisma.permission.findMany({ orderBy: [{ code: "asc" }, { id: "asc" }] }); }
  findRole(id: string) { return prisma.role.findUnique({ where: { id }, include }); }
  findRoleByCode(code: string) { return prisma.role.findUnique({ where: { code } }); }
  createRole(data: { code: string; name: string; description?: string; isActive: boolean }) { return prisma.role.create({ data, include }); }
  updateRole(id: string, data: { name?: string | undefined; description?: string | null | undefined; isActive?: boolean | undefined }) {
    return prisma.role.update({ where: { id }, data: {
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.description === undefined ? {} : { description: data.description }),
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    }, include });
  }
  async replacePermissions(roleId: string, permissionIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.permission.count({ where: { id: { in: permissionIds } } });
      if (count !== permissionIds.length) return null;
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length) await tx.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })) });
      return tx.role.findUnique({ where: { id: roleId }, include });
    });
  }
  permissionsInclude(permissionIds: string[], code: string) {
    return prisma.permission.count({ where: { id: { in: permissionIds }, code } }).then(Boolean);
  }
  roleHasPermission(roleId: string, code: string) {
    return prisma.role.count({ where: { id: roleId, isActive: true, permissions: { some: { permission: { code } } } } }).then(Boolean);
  }
  activeUserHasOtherPermission(roleId: string, code: string) {
    return prisma.user.count({ where: { isActive: true, roles: { some: { role: { id: { not: roleId }, isActive: true, permissions: { some: { permission: { code } } } } } } } }).then(Boolean);
  }
}
