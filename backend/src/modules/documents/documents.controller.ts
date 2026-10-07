import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { parseWith } from "../../shared/validation/validate.js";
import type { DocumentsService } from "./documents.service.js";
import { uploadDocumentFields, type deleteDocumentBody } from "./documents.schema.js";

export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}
  list = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await this.service.list(req.params.id as string)); } catch (e) { next(e); } };
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fields = parseWith(uploadDocumentFields, req.body);
      res.status(201).json(await this.service.upload(req.params.id as string, { ...fields, file: req.file }, req.auth!.userId, req.requestId));
    } catch (e) { next(e); }
  };
  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { item, stream } = await this.service.download(req.params.id as string);
      res.type(item.mimeType); res.attachment(item.originalName); res.setHeader("Content-Length", String(item.sizeBytes));
      res.setHeader("Cache-Control", "private, no-store");
      res.on("close", () => stream.destroy());
      stream.on("error", next).pipe(res);
    } catch (e) { next(e); }
  };
  remove = async (req: Request, res: Response, next: NextFunction) => { try { await this.service.remove(req.params.id as string, (req.body as z.infer<typeof deleteDocumentBody>).reason, req.auth!.userId, req.requestId); res.status(204).send(); } catch (e) { next(e); } };
}
