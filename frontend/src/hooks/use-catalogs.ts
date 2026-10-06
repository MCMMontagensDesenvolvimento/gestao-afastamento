import { queryOptions } from "@tanstack/react-query";
import type { Params } from "@/lib/api/types";
import type { TabelaConfig } from "@/lib/dados";
import { catalogOptions, listCatalogs } from "@/services/catalogs";
export const configQuery = (tabela: TabelaConfig, apenasAtivos = true) =>
  queryOptions({
    queryKey: ["catalogs", tabela, "options", apenasAtivos],
    queryFn: () => catalogOptions(tabela, apenasAtivos),
  });
export const catalogsPageQuery = (tabela: TabelaConfig, params: Params) =>
  queryOptions({
    queryKey: ["catalogs", tabela, "list", params],
    queryFn: () => listCatalogs(tabela, params),
  });
