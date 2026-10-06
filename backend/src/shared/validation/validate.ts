import type { NextFunction, RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

export function parseWith<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  throw new AppError(
    422,
    "VALIDATION_ERROR",
    "Existem campos inválidos.",
    result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "request",
      message: issue.message,
    })),
  );
}

export function validate(schema: {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}): RequestHandler {
  return (req, _res, next: NextFunction) => {
    try {
      if (schema.body) req.body = parseWith(schema.body, req.body);
      if (schema.params) req.params = parseWith(schema.params, req.params) as typeof req.params;
      if (schema.query) Object.defineProperty(req, "query", { value: parseWith(schema.query, req.query) });
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const uuidParams = z.object({ id: z.uuid() }).strict();
export const dateOnly = z.iso.date();
export const nullableDateOnly = dateOnly.nullable().optional();
