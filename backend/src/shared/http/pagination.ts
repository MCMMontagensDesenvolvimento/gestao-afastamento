import { z } from "zod";

const booleanQuery = z.enum(["true", "false"]).transform((value) => value === "true");

export const paginationFields = {
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().refine((value) => [10, 20, 50, 100].includes(value), {
    message: "perPage deve ser 10, 20, 50 ou 100.",
  }).default(10),
  search: z.string().trim().max(200).optional(),
  ativo: booleanQuery.optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
} as const;

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function pageMeta(page: number, perPage: number, total: number): PageMeta {
  return { page, perPage, total, totalPages: Math.ceil(total / perPage) };
}
