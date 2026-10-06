import { Router } from "express";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { uuidParams, validate } from "../../shared/validation/validate.js";
import { auditService } from "../audit/audit.routes.js";
import { AccessController } from "./access.controller.js";
import { AccessRepository } from "./access.repository.js";
import { createRoleBody, replacePermissionsBody, updateRoleBody } from "./access.schema.js";
import { AccessService } from "./access.service.js";

const controller = new AccessController(new AccessService(new AccessRepository(), auditService));
export const rolesRouter = Router();
rolesRouter.use(requireAuth);
rolesRouter.get("/", requirePermission("users.read"), controller.listRoles);
rolesRouter.post("/", requirePermission("permissions.manage"), validate({ body: createRoleBody }), controller.createRole);
rolesRouter.patch("/:id", requirePermission("permissions.manage"), validate({ params: uuidParams, body: updateRoleBody }), controller.updateRole);
rolesRouter.put("/:id/permissoes", requirePermission("permissions.manage"), validate({ params: uuidParams, body: replacePermissionsBody }), controller.permissions);

export const permissionsRouter = Router();
permissionsRouter.get("/", requireAuth, requirePermission("permissions.manage"), controller.listPermissions);
