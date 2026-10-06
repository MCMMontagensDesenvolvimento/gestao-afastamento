import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const validateMutationOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== env.FRONTEND_ORIGIN) {
    return next(new AppError(403, "ORIGIN_NOT_ALLOWED", "Origem da requisição não permitida."));
  }
  return next();
};
