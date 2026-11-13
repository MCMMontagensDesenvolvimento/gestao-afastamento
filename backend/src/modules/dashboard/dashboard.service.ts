import {
  addUtcDays,
  formatDateOnly,
  parseDateOnly,
  todayInBusinessTimezone,
} from "../../shared/dates/date-only.js";

import type { DashboardRepository } from "./dashboard.repository.js";

function calcularDuracaoMedia(
  leaves: Array<{
    id: string;
    dataAfastamento: Date;
    dataFimBeneficio: Date | null;
  }>,
) {
  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  const duracoes: number[] = [];

  for (const leave of leaves) {
    const inicio = leave.dataAfastamento;
    const fim = leave.dataFimBeneficio;

    if (!fim || inicio > fim) {
      continue;
    }

    const inicioUtc = Date.UTC(
      inicio.getUTCFullYear(),
      inicio.getUTCMonth(),
      inicio.getUTCDate(),
    );

    const fimUtc = Date.UTC(
      fim.getUTCFullYear(),
      fim.getUTCMonth(),
      fim.getUTCDate(),
    );

    const dias = (fimUtc - inicioUtc) / DAY_IN_MS;

    duracoes.push(dias);
  }

  const totalDias = duracoes.reduce((total, dias) => total + dias, 0);

  return {
    averageDays:
      duracoes.length > 0
        ? Number((totalDias / duracoes.length).toFixed(1))
        : 0,

    totalLeaves: duracoes.length,
    durations: duracoes,
  };
}

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async get() {
    const today = parseDateOnly(todayInBusinessTimezone());
    const in15 = addUtcDays(today, 15);
    const in30 = addUtcDays(today, 30);

    const data = await this.repository.load(today, in15);

    const duration = calcularDuracaoMedia(data.allLeaves);

    // Agrupa os afastamentos pela quantidade exata de dias
    const durationMap = new Map<number, number>();

    for (const days of duration.durations) {
      durationMap.set(days, (durationMap.get(days) ?? 0) + 1);
    }

    const durationDistribution = [...durationMap.entries()]
      .sort(([daysA], [daysB]) => daysA - daysB)
      .map(([days, total]) => ({
        days,
        total,
        label: `${days} dias`,
      }));

    const byObra = new Map<
      string,
      { obraId: string; obraNome: string; total: number }
    >();

    for (const leave of data.activeLeaves) {
      const current = byObra.get(leave.obraId) ?? {
        obraId: leave.obraId,
        obraNome: leave.obra.nome,
        total: 0,
      };

      current.total += 1;
      byObra.set(leave.obraId, current);
    }

    const byMonth = new Map<string, number>();

    for (const leave of data.newLeaves) {
      const month = leave.dataAfastamento.toISOString().slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    }

    const priorities = data.activeLeaves
      .flatMap((leave) => {
        const items: Array<{
          type: string;
          dueDate: string;
          isOverdue: boolean;
          afastamentoId: string;
          colaboradorId: string;
          colaboradorNome: string;
        }> = [];

        if (leave.dataFimBeneficio && leave.dataFimBeneficio <= in30) {
          items.push({
            type: "BENEFICIO",
            dueDate: formatDateOnly(leave.dataFimBeneficio)!,
            isOverdue: leave.dataFimBeneficio < today,
            afastamentoId: leave.id,
            colaboradorId: leave.colaboradorId,
            colaboradorNome: leave.colaborador.nome,
          });
        }

        if (leave.dataRetornoPrevista && leave.dataRetornoPrevista <= in15) {
          items.push({
            type: "RETORNO",
            dueDate: formatDateOnly(leave.dataRetornoPrevista)!,
            isOverdue: leave.dataRetornoPrevista < today,
            afastamentoId: leave.id,
            colaboradorId: leave.colaboradorId,
            colaboradorNome: leave.colaborador.nome,
          });
        }

        return items;
      })
      .sort(
        (a, b) =>
          a.dueDate.localeCompare(b.dueDate) || a.type.localeCompare(b.type),
      );

    return {
      data: {
        indicators: {
          activeLeaves: data.activeLeaves.length,
          expiredBenefits: data.expiredBenefits,
          expectedReturnsNext15Days: data.expectedReturns,
        },

        activeByObra: [...byObra.values()].sort(
          (a, b) =>
            a.obraNome.localeCompare(b.obraNome) ||
            a.obraId.localeCompare(b.obraId),
        ),

        newLeavesByMonth: [...byMonth]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, total]) => ({ month, total })),

        duration: {
          status: "available" as const,
          averageDays: duration.averageDays,
          totalLeaves: duration.totalLeaves,
          distribution: durationDistribution,
        },

        priorities,
      },
    };
  }
}