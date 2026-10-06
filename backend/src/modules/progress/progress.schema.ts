import { z } from "zod";
const fields = {
  tipoAndamentoId: z.uuid(), dataAndamento: z.iso.date(), descricao: z.string().trim().min(1).max(10_000),
  proximaAcao: z.string().trim().max(5_000).nullable().optional(), dataProximaAcao: z.iso.date().nullable().optional(),
} as const;
export const createProgressBody = z.object(fields).strict();
export const updateProgressBody = createProgressBody.partial().strict().refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
export const deleteProgressBody = z.object({ reason: z.string().trim().min(2).max(500).optional() }).strict().default({});
