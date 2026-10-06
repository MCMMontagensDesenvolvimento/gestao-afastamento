import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { AppError } from "../errors/app-error.js";
import { logger } from "../../infrastructure/logger/logger.js";

export const apiNotFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, "API_ROUTE_NOT_FOUND", `Rota ${req.method} ${req.originalUrl} não encontrada.`));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const malformedJson =
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "body" in error;
  const knownError = error instanceof AppError;
  const uploadError = error instanceof multer.MulterError;
  const prismaConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  const status = knownError ? error.status : malformedJson ? 400 : uploadError ? 422 : prismaConflict ? 409 : 500;

  if (!knownError && !malformedJson && !uploadError && !prismaConflict) {
    logger.error({ err: error, requestId: req.requestId }, "Erro não tratado");
  }

  res.status(status).json({
    status,
    code: knownError ? error.code : malformedJson ? "MALFORMED_JSON" : uploadError ? "UPLOAD_ERROR" : prismaConflict ? "DUPLICATE_VALUE" : "INTERNAL_ERROR",
    message: knownError
      ? error.message
      : malformedJson
        ? "O corpo JSON da requisição é inválido."
        : uploadError
          ? error.code === "LIMIT_FILE_SIZE" ? "O arquivo excede o limite permitido." : "O upload enviado é inválido."
          : prismaConflict
            ? "Já existe um registro com os mesmos dados únicos."
        : "Ocorreu um erro interno.",
    ...(knownError && error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    requestId: req.requestId,
  });
};
