import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { paginationFields } from "../../shared/http/pagination.js";
import { validate } from "../../shared/validation/validate.js";
import { AuditRepository } from "./audit.repository.js";
import { AuditService } from "./audit.service.js";

export const auditService = new AuditService(new AuditRepository());
const querySchema = z.object({
  page: paginationFields.page,
  perPage: paginationFields.perPage,
  actorUserId: z.uuid().optional(),
  entityType: z.string().trim().max(150).optional(),
  entityId: z.uuid().optional(),
  action: z.string().trim().max(150).optional(),
  dateFrom: z.iso.datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  dateTo: z.iso.datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  sortDirection: paginationFields.sortDirection,
}).strict();

export const auditRouter = Router();
auditRouter.get("/", requireAuth, requirePermission("audit.read"), validate({ query: querySchema }), async (req, res, next) => {
  try {
    res.json(await auditService.list(req.query as unknown as z.infer<typeof querySchema>));
  } catch (error) { next(error); }
});
