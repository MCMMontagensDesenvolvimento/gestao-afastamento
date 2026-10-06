import { api } from "@/lib/api/client";
import type { UserRole } from "./users";
export type Permission = { id: string; code: string; description: string | null };
export type Role = UserRole & {
  description: string | null;
  permissions: { permissionId: string; permission: Permission }[];
};
export async function listRoles() {
  return (await api<{ data: Role[] }>("/papeis")).data;
}
export async function listPermissions() {
  return (await api<{ data: Permission[] }>("/permissoes")).data;
}
export function replaceRolePermissions(id: string, permissionIds: string[]) {
  return api<{ data: Role }>(`/papeis/${id}/permissoes`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}
