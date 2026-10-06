import { Router } from "express";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { uuidParams, validate } from "../../shared/validation/validate.js";
import { auditService } from "../audit/audit.routes.js";
import { LeavesController } from "./leaves.controller.js";
import { LeavesRepository } from "./leaves.repository.js";
import { createLeaveBody, leavesQuery, updateLeaveBody } from "./leaves.schema.js";
import { LeavesService } from "./leaves.service.js";

const controller = new LeavesController(new LeavesService(new LeavesRepository(), auditService));
export const leavesRouter = Router();
leavesRouter.use(requireAuth);
leavesRouter.get("/", requirePermission("leaves.read"), validate({ query: leavesQuery }), controller.list);
leavesRouter.get("/:id", requirePermission("leaves.read"), validate({ params: uuidParams }), controller.get);
leavesRouter.post("/", requirePermission("leaves.create"), validate({ body: createLeaveBody }), controller.create);
leavesRouter.patch("/:id", requirePermission("leaves.update"), validate({ params: uuidParams, body: updateLeaveBody }), controller.update);
