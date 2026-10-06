import { AppError } from "../../shared/errors/app-error.js";
import type { HealthRepository } from "./health.repository.js";

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  getLiveness(): { status: "ok"; service: string } {
    return { status: "ok", service: "gestao-afastados-backend" };
  }

  async getDatabaseReadiness(): Promise<{ status: "ok"; database: "reachable" }> {
    try {
      await this.repository.checkDatabase();
      return { status: "ok", database: "reachable" };
    } catch {
      throw new AppError(503, "DATABASE_UNAVAILABLE", "O banco de dados não está disponível.");
    }
  }
}
