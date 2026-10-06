import { z } from "zod";
export const uploadDocumentFields = z.object({ tipoDocumentoId: z.uuid(), andamentoId: z.uuid().optional() }).strict();
export const deleteDocumentBody = z.object({ reason: z.string().trim().min(2).max(500).optional() }).strict().default({});
