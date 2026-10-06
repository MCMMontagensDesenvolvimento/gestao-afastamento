import { pageMeta } from "../../shared/http/pagination.js";
import type { AuditEvent, AuditRepository } from "./audit.repository.js";

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  record(event: AuditEvent): Promise<unknown> {
    return this.repository.create(event);
  }

  async list(input: Parameters<AuditRepository["list"]>[0]) {
    const result = await this.repository.list(input);
    return { data: result.data, meta: pageMeta(input.page, input.perPage, result.total) };
  }
}
