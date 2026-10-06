import { z } from "zod";
import { paginationFields } from "../../shared/http/pagination.js";

export const employeesQuery = z.object({
  page: paginationFields.page, perPage: paginationFields.perPage, search: paginationFields.search,
  obraId: z.uuid().optional(), funcaoId: z.uuid().optional(), ativo: paginationFields.ativo,
  sortBy: z.enum(["nome", "codigoCorporativo", "createdAt"]).default("nome"), sortDirection: paginationFields.sortDirection,
}).strict();
export const createEmployeeBody = z.object({
  codigoCorporativo: z.string().trim().min(1).max(100), nome: z.string().trim().min(2).max(200),
  contato: z.string().trim().max(255).optional(), obraId: z.uuid(), funcaoId: z.uuid(),
}).strict();
export const updateEmployeeBody = z.object({
  nome: z.string().trim().min(2).max(200).optional(), contato: z.string().trim().max(255).nullable().optional(), obraId: z.uuid().optional(), funcaoId: z.uuid().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
export const historyQuery = z.object({ page: paginationFields.page, perPage: paginationFields.perPage }).strict();
