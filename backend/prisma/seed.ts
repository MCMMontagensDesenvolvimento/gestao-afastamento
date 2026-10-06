import "dotenv/config";
import { disconnectDatabase } from "../src/infrastructure/database/prisma.js";
import { BootstrapRepository } from "../src/modules/access/bootstrap.repository.js";
import { BootstrapService } from "../src/modules/access/bootstrap.service.js";

const service = new BootstrapService(new BootstrapRepository());

try {
  const result = await service.execute(process.env.BOOTSTRAP_ADMIN_EMAIL);
  process.stdout.write(
    `Seed base concluída. Bootstrap administrativo: ${result.adminCreated ? "configurado" : "não solicitado"}.\n`,
  );
} finally {
  await disconnectDatabase();
}
