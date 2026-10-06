import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { AccessService } from "./access.service.js";
import type { createRoleBody, replacePermissionsBody, updateRoleBody } from "./access.schema.js";

export class AccessController {
  constructor(private readonly service: AccessService) {}
  listRoles = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.listRoles()); } catch (e) { next(e); } };
  listPermissions = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.listPermissions()); } catch (e) { next(e); } };
  createRole = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.createRole(req.body as z.infer<typeof createRoleBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  updateRole = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.updateRole(req.params.id as string, req.body as z.infer<typeof updateRoleBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  permissions = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.replacePermissions(req.params.id as string, (req.body as z.infer<typeof replacePermissionsBody>).permissionIds, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
}
