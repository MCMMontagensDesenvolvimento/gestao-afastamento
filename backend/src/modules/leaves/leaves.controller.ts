import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { LeavesService } from "./leaves.service.js";
import type { createLeaveBody, leavesQuery, updateLeaveBody } from "./leaves.schema.js";

export class LeavesController {
  constructor(private readonly service: LeavesService) {}
  list = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.list(req.query as unknown as z.infer<typeof leavesQuery>)); } catch (e) { next(e); } };
  get = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.get(req.params.id as string)); } catch (e) { next(e); } };
  create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.create(req.body as z.infer<typeof createLeaveBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  update = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.update(req.params.id as string, req.body as z.infer<typeof updateLeaveBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
}
