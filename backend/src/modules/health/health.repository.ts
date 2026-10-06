import { prisma } from "../../infrastructure/database/prisma.js";

export class HealthRepository {
  async checkDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }
}
