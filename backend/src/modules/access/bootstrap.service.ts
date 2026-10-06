import { BASE_PERMISSIONS } from "./access.constants.js";
import type { BootstrapRepository } from "./bootstrap.repository.js";

const allowedDomains = new Set(["mcm.eng.br", "mcmmontagens.com.br"]);

export class BootstrapService {
  constructor(private readonly repository: BootstrapRepository) {}

  async execute(bootstrapAdminEmail?: string): Promise<{ adminCreated: boolean }> {
    const { adminRoleId } = await this.repository.seedAccessBase(BASE_PERMISSIONS);

    if (!bootstrapAdminEmail) {
      return { adminCreated: false };
    }

    const email = bootstrapAdminEmail.trim().toLowerCase();
    const domain = email.split("@")[1];

    if (!domain || !allowedDomains.has(domain)) {
      throw new Error("BOOTSTRAP_ADMIN_EMAIL deve usar um domínio corporativo permitido.");
    }

    await this.repository.upsertBootstrapAdmin(email, adminRoleId);
    return { adminCreated: true };
  }
}
