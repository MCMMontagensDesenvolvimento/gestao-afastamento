import { prisma } from "../../infrastructure/database/prisma.js";

const include = { tipoAndamento: true, createdBy: { select: { id: true, name: true } }, updatedBy: { select: { id: true, name: true } } } as const;
export interface ProgressWriteData { tipoAndamentoId?: string; dataAndamento?: Date; descricao?: string; proximaAcao?: string | null; dataProximaAcao?: Date | null; }
export class ProgressRepository {
  leaveExists(id: string) { return prisma.afastamento.count({ where: { id } }).then(Boolean); }
  activeType(id: string) { return prisma.tipoAndamento.count({ where: { id, ativo: true } }).then(Boolean); }
  findById(id: string) { return prisma.afastamentoAndamento.findFirst({ where: { id, deletedAt: null }, include }); }
  list(afastamentoId: string) { return prisma.afastamentoAndamento.findMany({ where: { afastamentoId, deletedAt: null }, include, orderBy: [{ dataAndamento: "desc" }, { createdAt: "desc" }, { id: "desc" }] }); }
  create(afastamentoId: string, data: Required<Pick<ProgressWriteData, "tipoAndamentoId" | "dataAndamento" | "descricao">> & ProgressWriteData & { createdById: string }) { return prisma.afastamentoAndamento.create({ data: { afastamentoId, ...data }, include }); }
  update(id: string, data: ProgressWriteData & { updatedById: string }) { return prisma.afastamentoAndamento.update({ where: { id }, data, include }); }
  softDelete(id: string, deletedById: string, deleteReason?: string) { return prisma.afastamentoAndamento.update({ where: { id }, data: { deletedAt: new Date(), deletedById, ...(deleteReason ? { deleteReason } : {}) } }); }
}
