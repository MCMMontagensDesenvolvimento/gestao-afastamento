import { addUtcDays, formatDateOnly, parseDateOnly, todayInBusinessTimezone } from "../../shared/dates/date-only.js";
import type { DashboardRepository } from "./dashboard.repository.js";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}
  async get() {
    const today = parseDateOnly(todayInBusinessTimezone());
    const in15 = addUtcDays(today, 15);
    const in30 = addUtcDays(today, 30);
    const data = await this.repository.load(today, in15);
    const byObra = new Map<string, { obraId: string; obraNome: string; total: number }>();
    for (const leave of data.activeLeaves) {
      const current = byObra.get(leave.obraId) ?? { obraId: leave.obraId, obraNome: leave.obra.nome, total: 0 };
      current.total += 1; byObra.set(leave.obraId, current);
    }
    const byMonth = new Map<string, number>();
    for (const leave of data.newLeaves) { const month = leave.dataAfastamento.toISOString().slice(0, 7); byMonth.set(month, (byMonth.get(month) ?? 0) + 1); }
    const priorities = data.activeLeaves.flatMap((leave) => {
      const items: Array<{ type: string; dueDate: string; isOverdue: boolean; afastamentoId: string; colaboradorId: string; colaboradorNome: string }> = [];
      if (leave.dataFimBeneficio && leave.dataFimBeneficio <= in30) items.push({ type: "BENEFICIO", dueDate: formatDateOnly(leave.dataFimBeneficio)!, isOverdue: leave.dataFimBeneficio < today, afastamentoId: leave.id, colaboradorId: leave.colaboradorId, colaboradorNome: leave.colaborador.nome });
      if (leave.dataRetornoPrevista && leave.dataRetornoPrevista <= in15) items.push({ type: "RETORNO", dueDate: formatDateOnly(leave.dataRetornoPrevista)!, isOverdue: leave.dataRetornoPrevista < today, afastamentoId: leave.id, colaboradorId: leave.colaboradorId, colaboradorNome: leave.colaborador.nome });
      return items;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.type.localeCompare(b.type));
    return { data: {
      indicators: { activeLeaves: data.activeLeaves.length, expiredBenefits: data.expiredBenefits, expectedReturnsNext15Days: data.expectedReturns },
      activeByObra: [...byObra.values()].sort((a, b) => a.obraNome.localeCompare(b.obraNome) || a.obraId.localeCompare(b.obraId)),
      newLeavesByMonth: [...byMonth].sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total })),
      duration: { status: "pending_final_validation", series: [] }, priorities,
    } };
  }
}
