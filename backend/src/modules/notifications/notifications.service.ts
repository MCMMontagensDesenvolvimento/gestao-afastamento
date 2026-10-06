import { addUtcDays, formatDateOnly, parseDateOnly, todayInBusinessTimezone } from "../../shared/dates/date-only.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { NotificationsRepository } from "./notifications.repository.js";

interface Alert { id: string; key: string; type: string; title: string; message: string; isOverdue: boolean; dueDate: string; context: { afastamentoId: string; colaboradorId: string }; }
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}
  async list(userId: string, status: "all" | "unread") {
    const alerts = await this.derive();
    const reads = new Map((await this.repository.reads(userId, alerts.map((a) => a.key))).map((read) => [read.alertKey, read.readAt]));
    const mapped = alerts.map(({ key, ...alert }) => ({ ...alert, isRead: reads.has(key), readAt: reads.get(key)?.toISOString() ?? null }));
    const unreadCount = mapped.filter((a) => !a.isRead).length;
    return { data: status === "unread" ? mapped.filter((a) => !a.isRead) : mapped, meta: { unreadCount } };
  }
  async markRead(userId: string, id: string) {
    const alert = (await this.derive()).find((item) => item.id === id);
    if (!alert) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notificação não encontrada ou não está mais aplicável.");
    const read = await this.repository.upsertRead(userId, alert.key);
    return { data: { id, isRead: true, readAt: read.readAt.toISOString() } };
  }
  private async derive(): Promise<Alert[]> {
    const today = parseDateOnly(todayInBusinessTimezone());
    const { leaves, progress } = await this.repository.sources();
    const alerts: Alert[] = [];
    for (const leave of leaves) {
      if (leave.dataFimBeneficio && leave.dataFimBeneficio <= addUtcDays(today, 30)) {
        const date = formatDateOnly(leave.dataFimBeneficio)!;
        const overdue = leave.dataFimBeneficio < today;
        const key = `beneficio:${leave.id}:${date}`;
        alerts.push(build(key, overdue ? "BENEFICIO_VENCIDO" : "BENEFICIO_A_VENCER", overdue ? "Benefício vencido" : "Benefício próximo do vencimento", `${leave.colaborador.nome}: fim do benefício em ${date}.`, overdue, date, leave.id, leave.colaboradorId));
      }
      if (leave.dataRetornoPrevista && leave.dataRetornoPrevista <= addUtcDays(today, 15)) {
        const date = formatDateOnly(leave.dataRetornoPrevista)!;
        const overdue = leave.dataRetornoPrevista < today;
        const key = `retorno:${leave.id}:${date}`;
        alerts.push(build(key, overdue ? "RETORNO_VENCIDO" : "RETORNO_PREVISTO", overdue ? "Retorno previsto vencido" : "Retorno previsto", `${leave.colaborador.nome}: retorno previsto em ${date}.`, overdue, date, leave.id, leave.colaboradorId));
      }
    }
    for (const item of progress) {
      if (item.dataProximaAcao && item.dataProximaAcao <= addUtcDays(today, 15)) {
        const date = formatDateOnly(item.dataProximaAcao)!;
        const overdue = item.dataProximaAcao < today;
        const key = `proxima_acao:${item.id}:${date}`;
        alerts.push(build(key, overdue ? "PROXIMA_ACAO_VENCIDA" : "PROXIMA_ACAO", overdue ? "Próxima ação vencida" : "Próxima ação", `${item.afastamento.colaborador.nome}: próxima ação em ${date}.`, overdue, date, item.afastamentoId, item.afastamento.colaboradorId));
      }
    }
    return alerts.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
  }
}
function build(key: string, type: string, title: string, message: string, isOverdue: boolean, dueDate: string, afastamentoId: string, colaboradorId: string): Alert {
  return { id: `alert_${Buffer.from(key).toString("base64url")}`, key, type, title, message, isOverdue, dueDate, context: { afastamentoId, colaboradorId } };
}
