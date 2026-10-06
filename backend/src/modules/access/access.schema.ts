import { z } from "zod";

export const createRoleBody = z.object({
  code: z.string().trim().min(2).max(100).regex(/^[A-Za-z][A-Za-z0-9_-]*$/),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().default(true),
}).strict();
export const updateRoleBody = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");
export const replacePermissionsBody = z.object({
  permissionIds: z.array(z.uuid()).max(100).transform((ids) => [...new Set(ids)]),
}).strict();
