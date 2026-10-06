import { Router } from "express";
import { z } from "zod";
import { paginationFields } from "../../shared/http/pagination.js";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { parseWith, uuidParams, validate } from "../../shared/validation/validate.js";
import { auditService } from "../audit/audit.routes.js";
import { CatalogsRepository, type CatalogKind } from "./catalogs.repository.js";
import { CatalogsService } from "./catalogs.service.js";

const query = z.object({ page: paginationFields.page, perPage: paginationFields.perPage, search: paginationFields.search, ativo: paginationFields.ativo }).strict();
const normalCreate = z.object({ nome: z.string().trim().min(2).max(200) }).strict();
const normalUpdate = z.object({ nome: z.string().trim().min(2).max(200).optional(), ativo: z.boolean().optional() }).strict().refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
const classification = z.enum(["ATIVO", "ENCERRADO", "APOSENTADO"]);
const situationCreate = normalCreate.extend({ classificacao: classification });
const situationUpdate = z.object({ nome: z.string().trim().min(2).max(200).optional(), ativo: z.boolean().optional(), classificacao: classification.optional() }).strict().refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
const service = new CatalogsService(new CatalogsRepository(), auditService);

export function catalogRouter(kind: CatalogKind): Router {
  const router = Router();
  const createSchema = kind === "situacao" ? situationCreate : normalCreate;
  const updateSchema = kind === "situacao" ? situationUpdate : normalUpdate;
  router.use(requireAuth, requirePermission("settings.manage"));
  router.get("/", validate({ query }), async (req, res, next) => { try { res.json(await service.list(kind, req.query as unknown as z.infer<typeof query>)); } catch (e) { next(e); } });
  router.post("/", validate({ body: createSchema }), async (req, res, next) => { try { res.status(201).json(await service.create(kind, parseWith(createSchema, req.body), req.auth!.userId, req.requestId)); } catch (e) { next(e); } });
  router.patch("/:id", validate({ params: uuidParams, body: updateSchema }), async (req, res, next) => { try { res.json(await service.update(kind, req.params.id as string, parseWith(updateSchema, req.body), req.auth!.userId, req.requestId)); } catch (e) { next(e); } });
  return router;
}
