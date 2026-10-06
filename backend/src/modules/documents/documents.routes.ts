import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { createDocumentStorage } from "../../infrastructure/storage/storage.factory.js";
import { requireAuth, requirePermission } from "../../shared/middlewares/auth.js";
import { uuidParams, validate } from "../../shared/validation/validate.js";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsRepository } from "./documents.repository.js";
import { deleteDocumentBody } from "./documents.schema.js";
import { DocumentsService } from "./documents.service.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1, fields: 2 } });
const controller = new DocumentsController(new DocumentsService(new DocumentsRepository(), createDocumentStorage()));
export const leaveDocumentsRouter = Router();
leaveDocumentsRouter.get("/:id/documentos", requireAuth, requirePermission("documents.read"), validate({ params: uuidParams }), controller.list);
leaveDocumentsRouter.post("/:id/documentos", requireAuth, requirePermission("documents.upload"), validate({ params: uuidParams }), upload.single("file"), controller.upload);
export const documentsRouter = Router();
documentsRouter.get("/:id/download", requireAuth, requirePermission("documents.download"), validate({ params: uuidParams }), controller.download);
documentsRouter.delete("/:id", requireAuth, requirePermission("documents.delete"), validate({ params: uuidParams, body: deleteDocumentBody }), controller.remove);
