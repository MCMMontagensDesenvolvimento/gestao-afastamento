import { formatDateOnly, parseDateOnly } from "../../shared/dates/date-only.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { ProgressRepository, ProgressWriteData } from "./progress.repository.js";

export interface ProgressPayload { tipoAndamentoId?: string | undefined; dataAndamento?: string | undefined; descricao?: string | undefined; proximaAcao?: string | null | undefined; dataProximaAcao?: string | null | undefined; }
export interface CreateProgressPayload extends ProgressPayload { tipoAndamentoId: string; dataAndamento: string; descricao: string; }
const map = <T extends { dataAndamento: Date; dataProximaAcao: Date | null }>(item: T) => ({ ...item, dataAndamento: formatDateOnly(item.dataAndamento), dataProximaAcao: formatDateOnly(item.dataProximaAcao) });
export class ProgressService {
  constructor(private readonly repository: ProgressRepository, private readonly audit: AuditService) {}
  async list(leaveId: string) { await this.requireLeave(leaveId); return { data: (await this.repository.list(leaveId)).map(map) }; }
  async create(leaveId: string, input: CreateProgressPayload, actor: string, requestId: string) {
    await this.requireLeave(leaveId); await this.requireActiveType(input.tipoAndamentoId);
    const item = await this.repository.create(leaveId, { ...this.toData(input), tipoAndamentoId: input.tipoAndamentoId, dataAndamento: parseDateOnly(input.dataAndamento), descricao: input.descricao, createdById: actor });
    await this.audit.record({ actorUserId: actor, action: "progress.create", entityType: "AfastamentoAndamento", entityId: item.id, requestId, metadata: { afastamentoId: leaveId, tipoAndamentoId: item.tipoAndamentoId } });
    return { data: map(item) };
  }
  async update(id: string, input: ProgressPayload, actor: string, requestId: string) {
    const current = await this.requireProgress(id);
    if (input.tipoAndamentoId && input.tipoAndamentoId !== current.tipoAndamentoId) await this.requireActiveType(input.tipoAndamentoId);
    const item = await this.repository.update(id, { ...this.toData(input), updatedById: actor });
    await this.audit.record({ actorUserId: actor, action: "progress.update", entityType: "AfastamentoAndamento", entityId: id, requestId, metadata: { fields: Object.keys(input) } });
    return { data: map(item) };
  }
  async remove(id: string, reason: string | undefined, actor: string, requestId: string) {
    await this.requireProgress(id); await this.repository.softDelete(id, actor, reason);
    await this.audit.record({ actorUserId: actor, action: "progress.delete", entityType: "AfastamentoAndamento", entityId: id, requestId, ...(reason ? { metadata: { reason } } : {}) });
  }
  private toData(input: ProgressPayload): ProgressWriteData { return { ...input, ...(input.dataAndamento ? { dataAndamento: parseDateOnly(input.dataAndamento) } : {}), ...(input.dataProximaAcao === undefined ? {} : { dataProximaAcao: input.dataProximaAcao ? parseDateOnly(input.dataProximaAcao) : null }) } as ProgressWriteData; }
  private async requireLeave(id: string) { if (!(await this.repository.leaveExists(id))) throw new AppError(404, "LEAVE_NOT_FOUND", "Afastamento não encontrado."); }
  private async requireProgress(id: string) { const item = await this.repository.findById(id); if (!item) throw new AppError(404, "PROGRESS_NOT_FOUND", "Andamento não encontrado."); return item; }
  private async requireActiveType(id: string) { if (!(await this.repository.activeType(id))) throw new AppError(422, "INACTIVE_PROGRESS_TYPE", "O tipo de andamento deve existir e estar ativo."); }
}
