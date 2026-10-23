import type { NextFunction, Request, Response } from "express";
import type { ApdataSyncService } from "./apdata-sync.service.js";

export class ApdataSyncController {
  constructor(private readonly service: ApdataSyncService) {}

  sincronizar = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const resultado = await this.service.sincronizar(
        req.auth!.userId,
        req.requestId ?? "",
      );

      return res.json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  sincronizarAfastamentos = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const resultado = await this.service.sincronizarAfastamentos(
        req.auth!.userId,
        req.requestId ?? "",
      );

      return res.json(resultado);
    } catch (error) {
      return next(error);
    }
  };
}