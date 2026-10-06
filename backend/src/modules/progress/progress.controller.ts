import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { ProgressService } from "./progress.service.js";
import type { createProgressBody, deleteProgressBody, updateProgressBody } from "./progress.schema.js";
export class ProgressController {
  constructor(private readonly service: ProgressService) {}
  list = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.list(req.params.id as string)); } catch (e) { next(e); } };
  create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.create(req.params.id as string, req.body as z.infer<typeof createProgressBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  update = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.update(req.params.id as string, req.body as z.infer<typeof updateProgressBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  remove = async (req: Request, res: Response, next: NextFunction) => { try { await this.service.remove(req.params.id as string, (req.body as z.infer<typeof deleteProgressBody>).reason, req.auth!.userId, req.requestId); res.status(204).send(); } catch (e) { next(e); } };
}
