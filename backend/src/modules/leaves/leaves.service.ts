import { parseDateOnly } from "../../shared/dates/date-only.js";
import { AppError } from "../../shared/errors/app-error.js";
import { pageMeta } from "../../shared/http/pagination.js";
import type { AuditService } from "../audit/audit.service.js";
import type { LeaveListInput, LeavesRepository, LeaveWriteData } from "./leaves.repository.js";
import { mapLeave } from "./leaves.mapper.js";

export interface LeavePayload {
  colaboradorId?: string | undefined; obraId?: string | undefined; funcaoId?: string | undefined; situacaoId?: string | undefined; tipoBeneficioId?: string | null | undefined;
  dataAfastamento?: string | undefined; dataFimBeneficio?: string | null | undefined; dataRetornoPrevista?: string | null | undefined; dataRetornoEfetiva?: string | null | undefined;
  causaCid?: string | null | undefined; observacoes?: string | null | undefined;
}
export interface CreateLeavePayload extends LeavePayload {
  colaboradorId: string;
  obraId: string;
  funcaoId: string;
  situacaoId: string;
  dataAfastamento: string;
}

export class LeavesService {
  constructor(private readonly repository: LeavesRepository, private readonly audit: AuditService) {}
  async list(input: LeaveListInput) { const r = await this.repository.list(input); return { data: r.data.map(mapLeave), meta: pageMeta(input.page, input.perPage, r.total) }; }
  async get(id: string) { return { data: mapLeave(await this.requireLeave(id)) }; }
  async create(input: CreateLeavePayload, actor: string, requestId: string) {
    await this.ensureReferences(input);
    const item = await this.repository.create({ ...this.toData(input), colaboradorId: input.colaboradorId, obraId: input.obraId, funcaoId: input.funcaoId, situacaoId: input.situacaoId, dataAfastamento: parseDateOnly(input.dataAfastamento), createdById: actor });
    await this.audit.record({ actorUserId: actor, action: "leave.create", entityType: "Afastamento", entityId: item.id, requestId, metadata: { colaboradorId: item.colaboradorId, situacaoId: item.situacaoId } });
    return { data: mapLeave(item) };
  }
  async update(id: string, input: LeavePayload, actor: string, requestId: string) {
    const current = await this.requireLeave(id);
    const references = {
      colaboradorId: input.colaboradorId ?? current.colaboradorId,
      obraId: input.obraId ?? current.obraId,
      funcaoId: input.funcaoId ?? current.funcaoId,
      situacaoId: input.situacaoId ?? current.situacaoId,
      tipoBeneficioId: input.tipoBeneficioId === undefined ? current.tipoBeneficioId : input.tipoBeneficioId,
    };
    const referenceChanged = Object.entries(references).some(([key, value]) => value !== current[key as keyof typeof references]);
    if (referenceChanged) await this.ensureReferences(references);
    const item = await this.repository.update(id, { ...this.toData(input), updatedById: actor });
    await this.audit.record({ actorUserId: actor, action: "leave.update", entityType: "Afastamento", entityId: id, requestId, metadata: { fields: Object.keys(input) } });
    return { data: mapLeave(item) };
  }
  private toData(input: LeavePayload): LeaveWriteData {
    return {
      ...input,
      ...(input.dataAfastamento === undefined ? {} : { dataAfastamento: parseDateOnly(input.dataAfastamento) }),
      ...(input.dataFimBeneficio === undefined ? {} : { dataFimBeneficio: input.dataFimBeneficio ? parseDateOnly(input.dataFimBeneficio) : null }),
      ...(input.dataRetornoPrevista === undefined ? {} : { dataRetornoPrevista: input.dataRetornoPrevista ? parseDateOnly(input.dataRetornoPrevista) : null }),
      ...(input.dataRetornoEfetiva === undefined ? {} : { dataRetornoEfetiva: input.dataRetornoEfetiva ? parseDateOnly(input.dataRetornoEfetiva) : null }),
    } as LeaveWriteData;
  }
  private async requireLeave(id: string) { const item = await this.repository.findById(id); if (!item) throw new AppError(404, "LEAVE_NOT_FOUND", "Afastamento não encontrado."); return item; }
  private async ensureReferences(ids: { colaboradorId: string; obraId: string; funcaoId: string; situacaoId: string; tipoBeneficioId?: string | null | undefined }) {
    const valid = await this.repository.validateReferences(ids);
    if (Object.values(valid).some((value) => !value)) throw new AppError(422, "INACTIVE_OR_INVALID_REFERENCE", "Colaborador e cadastros associados devem existir e estar ativos.");
  }
}
