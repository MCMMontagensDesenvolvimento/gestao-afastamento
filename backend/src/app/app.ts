import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";
import { logger } from "../infrastructure/logger/logger.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { apiNotFound, errorHandler } from "../shared/middlewares/error-handler.js";
import { requestIdMiddleware } from "../shared/middlewares/request-id.js";
import { validateMutationOrigin } from "../shared/middlewares/origin-validation.js";
import { apiRouter } from "./routes.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      autoLogging: {
        ignore: (req) => req.url?.startsWith("/api/v1/auth/callback") ?? false,
      },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser(env.SESSION_SECRET));
  app.use(express.json({ limit: "1mb" }));
  app.use(validateMutationOrigin);

  app.use("/health", healthRouter);
  app.use("/api/v1", apiRouter);
  app.use("/api/v1", apiNotFound);
  app.use(errorHandler);

  return app;
}
