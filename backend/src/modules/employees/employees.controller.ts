import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { EmployeesService } from "./employees.service.js";
import type {
  createEmployeeBody,
  employeesQuery,
  historyQuery,
  updateEmployeeBody,
} from "./employees.schema.js";

export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await this.service.list(
          req.query as unknown as z.infer<typeof employeesQuery>,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.get(req.params.id as string));
    } catch (e) {
      next(e);
    }
  };
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(201)
        .json(
          await this.service.create(
            req.body as z.infer<typeof createEmployeeBody>,
            req.auth!.userId,
            req.requestId,
          ),
        );
    } catch (e) {
      next(e);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await this.service.update(
          req.params.id as string,
          req.body as z.infer<typeof updateEmployeeBody>,
          req.auth!.userId,
          req.requestId,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  activate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await this.service.setActive(
          req.params.id as string,
          true,
          req.auth!.userId,
          req.requestId,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await this.service.setActive(
          req.params.id as string,
          false,
          req.auth!.userId,
          req.requestId,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  history = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as unknown as z.infer<typeof historyQuery>;
      res.json(
        await this.service.history(req.params.id as string, q.page, q.perPage),
      );
    } catch (e) {
      next(e);
    }
  };
}
