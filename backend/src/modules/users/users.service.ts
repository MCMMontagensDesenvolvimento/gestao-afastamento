import { AppError } from "../../shared/errors/app-error.js";
import { pageMeta } from "../../shared/http/pagination.js";
import { normalizeCorporateEmail } from "../../shared/security/email.js";
import type { AuditService } from "../audit/audit.service.js";
import type { UsersRepository } from "./users.repository.js";

export class UsersService {
  constructor(private readonly repository: UsersRepository, private readonly audit: AuditService) {}
  async list(input: Parameters<UsersRepository["list"]>[0]) {
    const result = await this.repository.list(input);
    return { data: result.data, meta: pageMeta(input.page, input.perPage, result.total) };
  }
  async get(id: string) { return { data: await this.requireUser(id) }; }
  async create(input: { name: string; email: string; isActive: boolean }, actor: string, requestId: string) {
    const email = normalizeCorporateEmail(input.email);
    if (await this.repository.findByEmail(email)) throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Já existe um usuário com este e-mail.");
    const user = await this.repository.create({ ...input, email });
    await this.audit.record({ actorUserId: actor, action: "user.create", entityType: "User", entityId: user.id, requestId, metadata: { isActive: user.isActive } });
    return { data: user };
  }
  async update(id: string, input: { name?: string | undefined }, actor: string, requestId: string) {
    await this.requireUser(id);
    const user = await this.repository.update(id, input);
    await this.audit.record({ actorUserId: actor, action: "user.update", entityType: "User", entityId: id, requestId, metadata: { fields: Object.keys(input) } });
    return { data: user };
  }
  async setActive(id: string, isActive: boolean, actor: string, requestId: string) {
    await this.requireUser(id);
    if (!isActive && await this.repository.hasPermission(id, "permissions.manage") && !(await this.repository.hasOtherUserWithPermission(id, "permissions.manage"))) {
      throw new AppError(409, "LAST_ADMINISTRATOR_REQUIRED", "Não é possível inativar o único usuário com capacidade administrativa.");
    }
    const user = await this.repository.setActive(id, isActive);
    await this.audit.record({ actorUserId: actor, action: isActive ? "user.activate" : "user.deactivate", entityType: "User", entityId: id, requestId });
    return { data: user };
  }
  async replaceRoles(id: string, roleIds: string[], actor: string, requestId: string) {
    await this.requireUser(id);
    const losesAdmin = await this.repository.hasPermission(id, "permissions.manage") && !(await this.repository.rolesProvidePermission(roleIds, "permissions.manage"));
    if (losesAdmin && !(await this.repository.hasOtherUserWithPermission(id, "permissions.manage"))) {
      throw new AppError(409, "LAST_ADMINISTRATOR_REQUIRED", "Não é possível remover a capacidade administrativa do único administrador.");
    }
    const user = await this.repository.replaceRoles(id, roleIds, actor);
    if (!user) throw new AppError(422, "INVALID_ROLE", "Um ou mais papéis não existem ou estão inativos.");
    await this.audit.record({ actorUserId: actor, action: "user.roles.replace", entityType: "User", entityId: id, requestId, metadata: { roleIds } });
    return { data: user };
  }
  private async requireUser(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuário não encontrado.");
    return user;
  }
}
