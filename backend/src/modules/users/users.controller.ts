import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { createUserBody, replaceRolesBody, updateUserBody, usersQuery } from "./users.schema.js";
import type { UsersService } from "./users.service.js";

export class UsersController {
  constructor(private readonly service: UsersService) {}
  list = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.list(req.query as unknown as z.infer<typeof usersQuery>)); } catch (e) { next(e); } };
  get = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.get(req.params.id as string)); } catch (e) { next(e); } };
  create = async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json(await this.service.create(req.body as z.infer<typeof createUserBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  update = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.update(req.params.id as string, req.body as z.infer<typeof updateUserBody>, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  activate = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.setActive(req.params.id as string, true, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  deactivate = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.setActive(req.params.id as string, false, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
  roles = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.replaceRoles(req.params.id as string, (req.body as z.infer<typeof replaceRolesBody>).roleIds, req.auth!.userId, req.requestId)); } catch (e) { next(e); } };
}
