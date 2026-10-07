import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AccessRepository } from "./access.repository.js";

export class AccessService {
  constructor(private readonly repository: AccessRepository, private readonly audit: AuditService) {}
  async listRoles() { return { data: await this.repository.listRoles() }; }
  async listPermissions() { return { data: await this.repository.listPermissions() }; }
  async createRole(input: { code: string; name: string; description?: string | undefined; isActive: boolean }, actor: string, requestId: string) {
    const code = input.code.trim().toUpperCase();
    if (code === "SMS") throw new AppError(422, "SMS_ROLE_PENDING_DEFINITION", "O perfil SMS ainda depende de definição formal.");
    if (await this.repository.findRoleByCode(code)) throw new AppError(409, "ROLE_CODE_ALREADY_EXISTS", "Já existe um papel com este código.");
    const role = await this.repository.createRole({ code, name: input.name, isActive: input.isActive, ...(input.description ? { description: input.description } : {}) });
    await this.audit.record({ actorUserId: actor, action: "role.create", entityType: "Role", entityId: role.id, requestId, metadata: { code } });
    return { data: role };
  }
  async updateRole(id: string, input: { name?: string | undefined; description?: string | null | undefined; isActive?: boolean | undefined }, actor: string, requestId: string) {
    const role = await this.requireRole(id);
    const updated = await this.repository.updateRole(id, input);
    if (!updated.changed) {
      throw new AppError(409, "LAST_ADMINISTRATIVE_ROLE_REQUIRED", "Não é possível inativar o único papel com capacidade administrativa.");
    }
    await this.audit.record({ actorUserId: actor, action: "role.update", entityType: "Role", entityId: id, requestId, metadata: { code: role.code, fields: Object.keys(input) } });
    return { data: updated.value };
  }
  async replacePermissions(id: string, permissionIds: string[], actor: string, requestId: string) {
    await this.requireRole(id);
    const result = await this.repository.replacePermissions(id, permissionIds);
    if (!result.changed) {
      throw new AppError(409, "LAST_ADMINISTRATIVE_ROLE_REQUIRED", "Não é possível remover a única capacidade administrativa existente.");
    }
    const role = result.value;
    if (!role) throw new AppError(422, "INVALID_PERMISSION", "Uma ou mais permissões não existem.");
    await this.audit.record({ actorUserId: actor, action: "role.permissions.replace", entityType: "Role", entityId: id, requestId, metadata: { permissionIds } });
    return { data: role };
  }
  private async requireRole(id: string) {
    const role = await this.repository.findRole(id);
    if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "Papel não encontrado.");
    return role;
  }
}
