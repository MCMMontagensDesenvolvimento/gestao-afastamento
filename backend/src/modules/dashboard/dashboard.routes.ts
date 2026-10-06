import { Router } from "express";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { DashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";
const service = new DashboardService(new DashboardRepository());
export const dashboardRouter = Router();
dashboardRouter.get("/", requireAuth, requirePermission("dashboard.read"), async (_req, res, next) => { try { res.json(await service.get()); } catch (e) { next(e); } });
