import { queryOptions } from "@tanstack/react-query";
import type { Params } from "@/lib/api/types";
import { listUsers } from "@/services/users";
import { listPermissions, listRoles } from "@/services/access";
export const usersQuery = (params: Params) =>
  queryOptions({ queryKey: ["users", "list", params], queryFn: () => listUsers(params) });
export const rolesQuery = () => queryOptions({ queryKey: ["roles"], queryFn: listRoles });
export const permissionsQuery = () =>
  queryOptions({ queryKey: ["permissions"], queryFn: listPermissions });
