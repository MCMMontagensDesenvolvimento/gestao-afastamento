import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { AppError } from "../../shared/errors/app-error.js";
import { authService, requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { AuthController } from "./auth.controller.js";

const controller = new AuthController(authService);

const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, "RATE_LIMIT_EXCEEDED", "Muitas tentativas. Tente novamente em instantes."));
  },
});

export const authRouter = Router();
authRouter.get("/login", loginLimiter, controller.login);
authRouter.get("/callback", loginLimiter, controller.callback);
authRouter.get("/me", requireAuth, requirePermission("session.access"), controller.me);
authRouter.post("/logout", requireAuth, requirePermission("session.access"), controller.logout);
