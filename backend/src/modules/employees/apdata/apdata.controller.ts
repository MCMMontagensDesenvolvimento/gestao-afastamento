import type { NextFunction, Request, Response } from "express";
import type { ApdataService } from "./apdata.service.js";

export class ApdataController {
  constructor(private readonly service: ApdataService) {}

  listarContratados = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const ativos = req.query.ativos !== "false";

      const contratados = await this.service.listarContratados({
        userIdBaseSigob: req.auth!.userId,
        apenasAtivos: ativos,
      });

      res.json({ data: contratados });
    } catch (e) {
      console.error("[APDATA] Erro ao listar contratados:", e);
      next(e);
    }
  };
}
