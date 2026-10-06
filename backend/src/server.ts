import { createServer } from "node:http";
import { createApp } from "./app/app.js";
import { env } from "./config/env.js";
import { disconnectDatabase } from "./infrastructure/database/prisma.js";
import { logger } from "./infrastructure/logger/logger.js";

const server = createServer(createApp());

server.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT }, "Backend iniciado");
});

function shutdown(signal: string): void {
  logger.info({ signal }, "Encerrando backend");
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
