import { prisma } from "../../infrastructure/database/prisma.js";

const include = { tipoDocumento: true, uploadedBy: { select: { id: true, name: true } } } as const;
export class DocumentsRepository {
  leaveExists(id: string) { return prisma.afastamento.count({ where: { id } }).then(Boolean); }
  activeType(id: string) { return prisma.tipoDocumento.count({ where: { id, ativo: true } }).then(Boolean); }
  progressBelongsToLeave(id: string, leaveId: string) { return prisma.afastamentoAndamento.count({ where: { id, afastamentoId: leaveId, deletedAt: null } }).then(Boolean); }
  list(afastamentoId: string) { return prisma.afastamentoDocumento.findMany({ where: { afastamentoId, deletedAt: null }, include, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }); }
  findById(id: string) { return prisma.afastamentoDocumento.findFirst({ where: { id, deletedAt: null }, include }); }
  create(data: { afastamentoId: string; andamentoId?: string | undefined; tipoDocumentoId: string; originalName: string; storageKey: string; mimeType: string; sizeBytes: bigint; sha256: string; uploadedById: string }, requestId: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.afastamentoDocumento.create({ data: {
        afastamentoId: data.afastamentoId, tipoDocumentoId: data.tipoDocumentoId, originalName: data.originalName,
        storageKey: data.storageKey, mimeType: data.mimeType, sizeBytes: data.sizeBytes, sha256: data.sha256,
        uploadedById: data.uploadedById, ...(data.andamentoId ? { andamentoId: data.andamentoId } : {}),
      }, include });
      await tx.auditLog.create({ data: {
        actorUserId: data.uploadedById, action: "document.upload", entityType: "AfastamentoDocumento",
        entityId: item.id, requestId, metadata: { afastamentoId: data.afastamentoId, mimeType: data.mimeType, sizeBytes: Number(data.sizeBytes) },
      } });
      return item;
    });
  }
  tombstone(id: string, deletedById: string, requestId: string, afastamentoId: string, mimeType: string, deleteReason?: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.afastamentoDocumento.update({ where: { id }, data: { deletedAt: new Date(), deletedById, ...(deleteReason ? { deleteReason } : {}) } });
      await tx.auditLog.create({ data: {
        actorUserId: deletedById, action: "document.delete", entityType: "AfastamentoDocumento", entityId: id, requestId,
        metadata: { afastamentoId, mimeType, reason: deleteReason ?? null },
      } });
      return item;
    });
  }
  async restoreAfterDeleteFailure(id: string, requestId: string): Promise<void> {
    await prisma.$transaction([
      prisma.afastamentoDocumento.update({ where: { id }, data: { deletedAt: null, deletedById: null, deleteReason: null } }),
      prisma.auditLog.deleteMany({ where: { entityId: id, action: "document.delete", requestId } }),
    ]);
  }
}
