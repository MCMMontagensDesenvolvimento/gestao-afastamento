
import { prisma } from "../../infrastructure/database/prisma.js";

export class DashboardRepository {
  async load(today: Date, in15Days: Date) {
    const activeWhere = {
      situacao: { classificacao: "ATIVO" as const },
    };

    const [
      activeLeaves,
      expiredBenefits,
      expectedReturns,
      newLeaves,
      allLeaves,
    ] = await Promise.all([
      // Afastamentos ativos
      prisma.afastamento.findMany({
        where: activeWhere,
        select: {
          id: true,
          colaboradorId: true,
          obraId: true,
          obra: { select: { nome: true } },
          colaborador: { select: { nome: true } },
          dataAfastamento: true,
          dataFimBeneficio: true,
          dataRetornoPrevista: true,
        },
      }),

      // Benefícios vencidos
      prisma.afastamento.count({
        where: {
          ...activeWhere,
          dataFimBeneficio: { lt: today },
        },
      }),

      // Retornos previstos nos próximos 15 dias
      prisma.afastamento.count({
        where: {
          ...activeWhere,
          dataRetornoPrevista: {
            gte: today,
            lte: in15Days,
          },
        },
      }),

      // Datas de início para indicadores mensais
      prisma.afastamento.findMany({
        select: {
          dataAfastamento: true,
        },
      }),

      // Todos os afastamentos com fim de benefício preenchido
      prisma.afastamento.findMany({
        where: {
          dataFimBeneficio: {
            not: null,
          },
        },
        select: {
          id: true,
          dataAfastamento: true,
          dataFimBeneficio: true,
        },
        orderBy: {
          dataAfastamento: "asc",
        },
      }),
    ]);

    return {
      activeLeaves,
      expiredBenefits,
      expectedReturns,
      newLeaves,
      allLeaves,
    };
  }
}
