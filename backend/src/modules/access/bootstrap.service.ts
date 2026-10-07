import { BASE_PERMISSIONS } from "./access.constants.js";
import type { BootstrapRepository } from "./bootstrap.repository.js";
import { parseCorporateEmail } from "../../shared/security/corporate-email.js";

const allowedDomains = ["mcm.eng.br", "mcmmontagens.com.br"];

export class BootstrapService {
  constructor(private readonly repository: BootstrapRepository) {}

  async execute(bootstrapAdminEmail?: string): Promise<{ adminCreated: boolean }> {
    const email = bootstrapAdminEmail ? parseCorporateEmail(bootstrapAdminEmail, allowedDomains) : undefined;
    if (bootstrapAdminEmail && !email) {
      throw new Error("BOOTSTRAP_ADMIN_EMAIL deve ser um e-mail válido de domínio corporativo permitido.");
    }
    const { adminRoleId } = await this.repository.seedAccessBase(BASE_PERMISSIONS);

    if (!email) {
      return { adminCreated: false };
    }

    await this.repository.upsertBootstrapAdmin(email, adminRoleId);
    return { adminCreated: true };
  }
}
