import { queryOptions } from "@tanstack/react-query";
import type { Params } from "@/lib/api/types";
import { employeeHistory, getEmployee, listEmployees } from "@/services/employees";
export const employeesPageQuery = (params: Params) =>
  queryOptions({
    queryKey: ["employees", "list", params],
    queryFn: () => listEmployees(params),
  });
export const colaboradoresQuery = (apenasAtivos = false, search = "") =>
  queryOptions({
    queryKey: ["employees", "options", apenasAtivos, search],
    queryFn: async () =>
      (
        await listEmployees({
          ativo: apenasAtivos ? true : undefined,
          search,
          page: 1,
          perPage: 20,
        })
      ).data,
  });
export const employeeQuery = (id: string) =>
  queryOptions({
    queryKey: ["employees", "detail", id],
    queryFn: () => getEmployee(id),
    enabled: Boolean(id),
  });
export const employeeHistoryQuery = (id: string, params: Params) =>
  queryOptions({
    queryKey: ["employees", "history", id, params],
    queryFn: () => employeeHistory(id, params),
    enabled: Boolean(id),
  });
