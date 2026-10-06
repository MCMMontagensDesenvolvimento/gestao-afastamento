import { AppError } from "../../shared/errors/app-error.js";
import { pageMeta } from "../../shared/http/pagination.js";
import type { AuditService } from "../audit/audit.service.js";
import type { CatalogKind, CatalogListInput, CatalogsRepository } from "./catalogs.repository.js";

export class CatalogsService {
  constructor(private readonly repository: CatalogsRepository, private readonly audit: AuditService) {}
  async list(kind: CatalogKind, input: CatalogListInput) {
    const [data, total] = await this.repository.list(kind, input);
    return { data, meta: pageMeta(input.page, input.perPage, total) };
  }
  async create(kind: CatalogKind, input: { nome: string; classificacao?: "ATIVO" | "ENCERRADO" | "APOSENTADO" }, actor: string, requestId: string) {
    if (await this.repository.findByName(kind, input.nome)) throw new AppError(409, "CATALOG_NAME_ALREADY_EXISTS", "Já existe um item com este nome.");
    const item = await this.repository.create(kind, input);
    await this.audit.record({ actorUserId: actor, action: "catalog.create", entityType: kind, entityId: item.id, requestId, metadata: { nome: item.nome } });
    return { data: item };
  }
  async update(kind: CatalogKind, id: string, input: { nome?: string | undefined; ativo?: boolean | undefined; classificacao?: "ATIVO" | "ENCERRADO" | "APOSENTADO" | undefined }, actor: string, requestId: string) {
    if (!(await this.repository.findById(kind, id))) throw new AppError(404, "CATALOG_ITEM_NOT_FOUND", "Item de cadastro não encontrado.");
    if (input.nome) {
      const duplicate = await this.repository.findByName(kind, input.nome);
      if (duplicate && duplicate.id !== id) throw new AppError(409, "CATALOG_NAME_ALREADY_EXISTS", "Já existe um item com este nome.");
    }
    const item = await this.repository.update(kind, id, input);
    await this.audit.record({ actorUserId: actor, action: "catalog.update", entityType: kind, entityId: id, requestId, metadata: { fields: Object.keys(input) } });
    return { data: item };
  }
}
