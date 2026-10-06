import { z } from "zod";
import { paginationFields } from "../../shared/http/pagination.js";

export const usersQuery = z.object({
  page: paginationFields.page,
  perPage: paginationFields.perPage,
  search: paginationFields.search,
  ativo: paginationFields.ativo,
  roleId: z.uuid().optional(),
}).strict();
export const createUserBody = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.email().max(320),
  isActive: z.boolean().default(true),
}).strict();
export const updateUserBody = z.object({ name: z.string().trim().min(2).max(200).optional() }).strict().refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
export const replaceRolesBody = z.object({ roleIds: z.array(z.uuid()).max(100).transform((ids) => [...new Set(ids)]) }).strict();
