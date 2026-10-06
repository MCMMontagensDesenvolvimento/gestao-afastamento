import { prisma } from "../../infrastructure/database/prisma.js";

export class DashboardRepository {
  async load(today: Date, in15Days: Date) {
    const activeWhere = { situacao: { classificacao: "ATIVO" as const } };
    const [activeLeaves, expiredBenefits, expectedReturns, newLeaves] = await Promise.all([
      prisma.afastamento.findMany({ where: activeWhere, select: { id: true, colaboradorId: true, obraId: true, obra: { select: { nome: true } }, colaborador: { select: { nome: true } }, dataFimBeneficio: true, dataRetornoPrevista: true } }),
      prisma.afastamento.count({ where: { ...activeWhere, dataFimBeneficio: { lt: today } } }),
      prisma.afastamento.count({ where: { ...activeWhere, dataRetornoPrevista: { gte: today, lte: in15Days } } }),
      prisma.afastamento.findMany({ select: { dataAfastamento: true } }),
    ]);
    return { activeLeaves, expiredBenefits, expectedReturns, newLeaves };
  }
}
