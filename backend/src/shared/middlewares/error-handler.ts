import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { AppError } from "../errors/app-error.js";
import { logger } from "../../infrastructure/logger/logger.js";

export const apiNotFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, "API_ROUTE_NOT_FOUND", "A rota solicitada não foi encontrada."));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const malformedJson =
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "body" in error;
  const knownError = error instanceof AppError;
  const oversizedBody = error instanceof Error && "type" in error && error.type === "entity.too.large";
  const uploadError = error instanceof multer.MulterError;
  const prismaConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  const status = knownError ? error.status : malformedJson ? 400 : oversizedBody ? 413 : uploadError ? 422 : prismaConflict ? 409 : 500;

  if (!knownError && !malformedJson && !oversizedBody && !uploadError && !prismaConflict) {
    logger.error({
      errorType: error instanceof Error ? error.constructor.name : "UnknownError",
      ...(error instanceof Prisma.PrismaClientKnownRequestError ? { errorCode: error.code } : {}),
      requestId: req.requestId,
    }, "Erro não tratado");
  }

  if (res.headersSent) {
    res.destroy();
    return;
  }
  // Um download pode falhar depois de preparar os cabeçalhos, antes de enviar bytes.
  res.removeHeader("Content-Length");
  res.removeHeader("Content-Disposition");
  res.removeHeader("Content-Type");

  res.status(status).json({
    status,
    code: knownError ? error.code : malformedJson ? "MALFORMED_JSON" : oversizedBody ? "REQUEST_BODY_TOO_LARGE" : uploadError ? "UPLOAD_ERROR" : prismaConflict ? "DUPLICATE_VALUE" : "INTERNAL_ERROR",
    message: knownError
      ? error.message
      : malformedJson
        ? "O corpo JSON da requisição é inválido."
        : oversizedBody
          ? "O corpo da requisição excede o limite permitido."
        : uploadError
          ? error.code === "LIMIT_FILE_SIZE" ? "O arquivo excede o limite permitido." : "O upload enviado é inválido."
          : prismaConflict
            ? "Já existe um registro com os mesmos dados únicos."
        : "Ocorreu um erro interno.",
    ...(knownError && error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    requestId: req.requestId,
  });
};
