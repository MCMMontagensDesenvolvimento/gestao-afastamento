import type { NextFunction, Request, Response } from "express";
import type { HealthService } from "./health.service.js";

export class HealthController {
  constructor(private readonly service: HealthService) {}

  liveness = (_req: Request, res: Response): void => {
    res.status(200).json(this.service.getLiveness());
  };

  databaseReadiness = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json(await this.service.getDatabaseReadiness());
    } catch (error) {
      next(error);
    }
  };
}
