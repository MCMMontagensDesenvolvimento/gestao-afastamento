import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

export interface AuditEvent {
  actorUserId?: string | undefined;
  action: string;
  entityType: string;
  entityId?: string | undefined;
  metadata?: Prisma.InputJsonValue | undefined;
  requestId: string;
}

export class AuditRepository {
  create(event: AuditEvent) {
    return prisma.auditLog.create({ data: {
      action: event.action, entityType: event.entityType, requestId: event.requestId,
      ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
      ...(event.entityId ? { entityId: event.entityId } : {}),
      ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
    } });
  }

  async list(input: {
    page: number; perPage: number; actorUserId?: string | undefined; entityType?: string | undefined; entityId?: string | undefined;
    action?: string | undefined; dateFrom?: Date | undefined; dateTo?: Date | undefined; sortDirection: "asc" | "desc";
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.dateFrom || input.dateTo ? { createdAt: { ...(input.dateFrom ? { gte: input.dateFrom } : {}), ...(input.dateTo ? { lte: input.dateTo } : {}) } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: [{ createdAt: input.sortDirection }, { id: input.sortDirection }],
        skip: (input.page - 1) * input.perPage,
        take: input.perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }
}
