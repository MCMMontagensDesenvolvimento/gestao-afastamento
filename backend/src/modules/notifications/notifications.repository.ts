import { prisma } from "../../infrastructure/database/prisma.js";

export class NotificationsRepository {
  async sources() {
    const leaves = await prisma.afastamento.findMany({
      where: { situacao: { classificacao: "ATIVO" }, OR: [{ dataFimBeneficio: { not: null } }, { dataRetornoPrevista: { not: null } }] },
      select: { id: true, colaboradorId: true, dataFimBeneficio: true, dataRetornoPrevista: true, colaborador: { select: { nome: true } } },
    });
    const progress = await prisma.afastamentoAndamento.findMany({
      where: { deletedAt: null, dataProximaAcao: { not: null }, afastamento: { situacao: { classificacao: "ATIVO" } } },
      select: { id: true, afastamentoId: true, dataProximaAcao: true, proximaAcao: true, afastamento: { select: { colaboradorId: true, colaborador: { select: { nome: true } } } } },
    });
    return { leaves, progress };
  }
  reads(userId: string, alertKeys: string[]) { return prisma.notificationRead.findMany({ where: { userId, alertKey: { in: alertKeys } } }); }
  upsertRead(userId: string, alertKey: string) { const now = new Date(); return prisma.notificationRead.upsert({ where: { userId_alertKey: { userId, alertKey } }, update: { readAt: now }, create: { userId, alertKey, readAt: now } }); }
}
