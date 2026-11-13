import { formatDateOnly } from "../../shared/dates/date-only.js";
import { AppError } from "../../shared/errors/app-error.js";
import { pageMeta } from "../../shared/http/pagination.js";
import type { AuditService } from "../audit/audit.service.js";
import type {
  EmployeeListInput,
  EmployeesRepository,
} from "./employees.repository.js";

type EmployeeWrite = {
  nome: string;
  contato?: string | null | undefined;
  obraId: string;
  funcaoId: string;
};
type EmployeeUpdate = {
  nome?: string | undefined;
  contato?: string | null | undefined;
  obraId?: string | undefined;
  funcaoId?: string | undefined;
};
export class EmployeesService {
  constructor(
    private readonly repository: EmployeesRepository,
    private readonly audit: AuditService,
  ) {}
  async list(input: EmployeeListInput) {
    const r = await this.repository.list(input);
    return { data: r.data, meta: pageMeta(input.page, input.perPage, r.total) };
  }
  async get(id: string) {
    return { data: await this.requireEmployee(id) };
  }
  async create(
    input: EmployeeWrite & { codigoCorporativo: string },
    actor: string,
    requestId: string,
  ) {
    if (await this.repository.findByCode(input.codigoCorporativo))
      throw new AppError(
        409,
        "EMPLOYEE_CODE_ALREADY_EXISTS",
        "Já existe um colaborador com este identificador.",
      );
    await this.ensureActiveContext(input.obraId, input.funcaoId);
    const item = await this.repository.create({
      codigoCorporativo: input.codigoCorporativo,
      nome: input.nome,
      obraId: input.obraId,
      funcaoId: input.funcaoId,
      ...(input.contato ? { contato: input.contato } : {}),
    });
    await this.audit.record({
      actorUserId: actor,
      action: "employee.create",
      entityType: "Colaborador",
      entityId: item.id,
      requestId,
      metadata: { codigoCorporativo: item.codigoCorporativo },
    });
    return { data: item };
  }
  async update(
    id: string,
    input: EmployeeUpdate,
    actor: string,
    requestId: string,
  ) {
    const current = await this.requireEmployee(id);

    const obraId = input.obraId ?? current.obraId;
    const funcaoId = input.funcaoId ?? current.funcaoId;

    if (obraId && funcaoId) {
      const context = await this.repository.activeContext(obraId, funcaoId);

      if (!context.obra) {
        throw new Error("A obra informada não existe ou está inativa.");
      }

      if (!context.funcao) {
        throw new Error("A função informada não existe ou está inativa.");
      }
    }

    const item = await this.repository.update(id, input);
    await this.audit.record({
      actorUserId: actor,
      action: "employee.update",
      entityType: "Colaborador",
      entityId: id,
      requestId,
      metadata: { fields: Object.keys(input) },
    });
    return { data: item };
  }
  async setActive(
    id: string,
    ativo: boolean,
    actor: string,
    requestId: string,
  ) {
    await this.requireEmployee(id);
    const item = await this.repository.setActive(id, ativo);
    await this.audit.record({
      actorUserId: actor,
      action: ativo ? "employee.activate" : "employee.deactivate",
      entityType: "Colaborador",
      entityId: id,
      requestId,
    });
    return { data: item };
  }
  async history(id: string, page: number, perPage: number) {
    const employee = await this.requireEmployee(id);
    const result = await this.repository.history(id, page, perPage);
    return {
      data: {
        colaborador: {
          id: employee.id,
          codigoCorporativo: employee.codigoCorporativo,
          nome: employee.nome,
        },
        afastamentos: result.data.map((item) => ({
          ...item,
          dataAfastamento: formatDateOnly(item.dataAfastamento),
          dataFimBeneficio: formatDateOnly(item.dataFimBeneficio),
          dataRetornoPrevista: formatDateOnly(item.dataRetornoPrevista),
          dataRetornoEfetiva: formatDateOnly(item.dataRetornoEfetiva),
        })),
      },
      meta: pageMeta(page, perPage, result.total),
    };
  }
  private async requireEmployee(id: string) {
    const item = await this.repository.findById(id);
    if (!item)
      throw new AppError(
        404,
        "EMPLOYEE_NOT_FOUND",
        "Colaborador não encontrado.",
      );
    return item;
  }
  private async ensureActiveContext(obraId: string, funcaoId: string) {
    const c = await this.repository.activeContext(obraId, funcaoId);
    if (!c.obra || !c.funcao)
      throw new AppError(
        422,
        "INACTIVE_EMPLOYEE_CONTEXT",
        "Obra e função devem existir e estar ativas.",
      );
  }
}
