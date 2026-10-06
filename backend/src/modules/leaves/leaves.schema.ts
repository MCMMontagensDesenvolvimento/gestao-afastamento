import { z } from "zod";
import { paginationFields } from "../../shared/http/pagination.js";

export const leavesQuery = z.object({
  page: paginationFields.page, perPage: paginationFields.perPage, search: paginationFields.search,
  colaboradorId: z.uuid().optional(), obraId: z.uuid().optional(), funcaoId: z.uuid().optional(),
  tipoBeneficioId: z.uuid().optional(), situacaoId: z.uuid().optional(),
  sortBy: z.enum(["dataAfastamento", "dataRetornoPrevista", "dataFimBeneficio", "createdAt"]).default("dataAfastamento"),
  sortDirection: paginationFields.sortDirection,
}).strict();
const fields = {
  colaboradorId: z.uuid(), obraId: z.uuid(), funcaoId: z.uuid(), situacaoId: z.uuid(),
  tipoBeneficioId: z.uuid().nullable().optional(), dataAfastamento: z.iso.date(),
  dataFimBeneficio: z.iso.date().nullable().optional(), dataRetornoPrevista: z.iso.date().nullable().optional(), dataRetornoEfetiva: z.iso.date().nullable().optional(),
  causaCid: z.string().trim().max(500).nullable().optional(), observacoes: z.string().trim().max(10_000).nullable().optional(),
} as const;
export const createLeaveBody = z.object(fields).strict();
export const updateLeaveBody = createLeaveBody.partial().strict().refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
