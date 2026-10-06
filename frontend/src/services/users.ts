import { api } from "@/lib/api/client";
import { withParams, type Page, type Params } from "@/lib/api/types";
export type UserRole = { id: string; code: string; name: string; isActive: boolean };
export type UserRecord = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};
export type ApplicationUser = UserRecord & { roles: { roleId: string; role: UserRole }[] };
export function listUsers(params: Params) {
  return api<Page<ApplicationUser>>(withParams("/usuarios", params));
}
export function createUser(data: { name: string; email: string; isActive: boolean }) {
  return api<{ data: UserRecord }>("/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function updateUser(id: string, name: string) {
  return api<{ data: UserRecord }>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}
export function setUserActive(id: string, active: boolean) {
  return api<{ data: UserRecord }>(`/usuarios/${id}/${active ? "ativar" : "inativar"}`, {
    method: "POST",
  });
}
export function replaceUserRoles(id: string, roleIds: string[]) {
  return api<{ data: ApplicationUser }>(`/usuarios/${id}/papeis`, {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  });
}
