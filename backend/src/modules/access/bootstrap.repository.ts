import { prisma } from "../../infrastructure/database/prisma.js";

export class BootstrapRepository {
  async seedAccessBase(permissionCodes: readonly string[]): Promise<{ adminRoleId: string }> {
    return prisma.$transaction(async (tx) => {
      const permissions = await Promise.all(
        permissionCodes.map((code) =>
          tx.permission.upsert({
            where: { code },
            update: {},
            create: { code },
          }),
        ),
      );

      const adminRole = await tx.role.upsert({
        where: { code: "ADMIN" },
        update: { name: "Administrador", isActive: true },
        create: {
          code: "ADMIN",
          name: "Administrador",
          description: "Papel administrativo base da aplicação.",
        },
      });

      await Promise.all(
        permissions.map((permission) =>
          tx.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: { roleId: adminRole.id, permissionId: permission.id },
          }),
        ),
      );

      return { adminRoleId: adminRole.id };
    });
  }

  async upsertBootstrapAdmin(email: string, adminRoleId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        update: { isActive: true },
        create: { email, name: email, isActive: true },
      });

      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: adminRoleId } },
        update: {},
        create: { userId: user.id, roleId: adminRoleId },
      });
    });
  }
}
