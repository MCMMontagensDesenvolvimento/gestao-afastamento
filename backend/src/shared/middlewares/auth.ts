import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { MicrosoftEntraAdapter } from "../../infrastructure/identity/microsoft-entra.adapter.js";
import { AuthRepository } from "../../modules/auth/auth.repository.js";
import { AuthService } from "../../modules/auth/auth.service.js";
import { AppError } from "../errors/app-error.js";

export const authService = new AuthService(new MicrosoftEntraAdapter(), new AuthRepository());

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const cookies = req.cookies as Record<string, string | undefined>;
    req.auth = await authService.authenticate(cookies[env.SESSION_COOKIE_NAME]);
    next();
  } catch (error) {
    next(error);
  }
};

export function requirePermission(...required: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, "AUTHENTICATION_REQUIRED", "É necessário autenticar-se."));
    if (required.some((permission) => !req.auth!.permissions.includes(permission))) {
      return next(new AppError(403, "PERMISSION_DENIED", "Você não possui permissão para esta operação."));
    }
    return next();
  };
}
