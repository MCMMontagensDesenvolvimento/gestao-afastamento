import { Router } from "express";
import { HealthController } from "./health.controller.js";
import { HealthRepository } from "./health.repository.js";
import { HealthService } from "./health.service.js";

const repository = new HealthRepository();
const service = new HealthService(repository);
const controller = new HealthController(service);

export const healthRouter = Router();
healthRouter.get("/", controller.liveness);
healthRouter.get("/db", controller.databaseReadiness);
