import { Router } from "express";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { uuidParams, validate } from "../../shared/validation/validate.js";
import { auditService } from "../audit/audit.routes.js";
import { EmployeesController } from "./employees.controller.js";
import { EmployeesRepository } from "./employees.repository.js";
import { createEmployeeBody, employeesQuery, historyQuery, updateEmployeeBody } from "./employees.schema.js";
import { EmployeesService } from "./employees.service.js";

const controller = new EmployeesController(new EmployeesService(new EmployeesRepository(), auditService));
export const employeesRouter = Router();
employeesRouter.use(requireAuth);
employeesRouter.get("/", requirePermission("employees.read"), validate({ query: employeesQuery }), controller.list);
employeesRouter.get("/:id/historico", requirePermission("employees.read", "leaves.read"), validate({ params: uuidParams, query: historyQuery }), controller.history);
employeesRouter.get("/:id", requirePermission("employees.read"), validate({ params: uuidParams }), controller.get);
employeesRouter.post("/", requirePermission("employees.manage"), validate({ body: createEmployeeBody }), controller.create);
employeesRouter.patch("/:id", requirePermission("employees.manage"), validate({ params: uuidParams, body: updateEmployeeBody }), controller.update);
employeesRouter.post("/:id/ativar", requirePermission("employees.manage"), validate({ params: uuidParams }), controller.activate);
employeesRouter.post("/:id/inativar", requirePermission("employees.manage"), validate({ params: uuidParams }), controller.deactivate);
