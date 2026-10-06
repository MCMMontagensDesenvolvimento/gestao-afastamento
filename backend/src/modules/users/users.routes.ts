import { Router } from "express";
import { auditService } from "../audit/audit.routes.js";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { uuidParams, validate } from "../../shared/validation/validate.js";
import { UsersController } from "./users.controller.js";
import { UsersRepository } from "./users.repository.js";
import { createUserBody, replaceRolesBody, updateUserBody, usersQuery } from "./users.schema.js";
import { UsersService } from "./users.service.js";

const controller = new UsersController(new UsersService(new UsersRepository(), auditService));
export const usersRouter = Router();
usersRouter.use(requireAuth);
usersRouter.get("/", requirePermission("users.read"), validate({ query: usersQuery }), controller.list);
usersRouter.get("/:id", requirePermission("users.read"), validate({ params: uuidParams }), controller.get);
usersRouter.post("/", requirePermission("users.manage"), validate({ body: createUserBody }), controller.create);
usersRouter.patch("/:id", requirePermission("users.manage"), validate({ params: uuidParams, body: updateUserBody }), controller.update);
usersRouter.post("/:id/ativar", requirePermission("users.manage"), validate({ params: uuidParams }), controller.activate);
usersRouter.post("/:id/inativar", requirePermission("users.manage"), validate({ params: uuidParams }), controller.deactivate);
usersRouter.put("/:id/papeis", requirePermission("permissions.manage"), validate({ params: uuidParams, body: replaceRolesBody }), controller.roles);
