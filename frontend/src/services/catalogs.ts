import { api } from "@/lib/api/client";
import { withParams, type Page, type Params } from "@/lib/api/types";
import type { Classificacao, ItemSimples, TabelaConfig } from "@/lib/dados";

const paths: Record<TabelaConfig, string> = {
  obras: "/obras",
  funcoes: "/funcoes",
  tipos_beneficio: "/tipos-beneficio",
  situacoes_afastamento: "/situacoes-afastamento",
  tipos_andamento_afastamento: "/tipos-andamento",
  tipos_documento_afastamento: "/tipos-documento",
};
type CatalogDto = { id: string; nome: string; ativo: boolean; classificacao?: Classificacao };
export type CatalogWrite = { nome: string; classificacao?: Classificacao };
function mapCatalog(item: CatalogDto): ItemSimples {
  return {
    id: item.id,
    nome: item.nome,
    ativo: item.ativo,
    ...(item.classificacao ? { classificacao_sistema: item.classificacao } : {}),
  };
}
export async function listCatalogs(
  tabela: TabelaConfig,
  params: Params = {},
): Promise<Page<ItemSimples>> {
  const response = await api<Page<CatalogDto>>(withParams(paths[tabela], params));
  return { ...response, data: response.data.map(mapCatalog) };
}
/** Reference options only; administrative tables use listCatalogs with server pagination. */
export async function catalogOptions(
  tabela: TabelaConfig,
  apenasAtivos = true,
): Promise<ItemSimples[]> {
  const items: ItemSimples[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await listCatalogs(tabela, {
      page,
      perPage: 100,
      ativo: apenasAtivos ? true : undefined,
    });
    items.push(...response.data);
    totalPages = response.meta.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}
export function createCatalog(tabela: TabelaConfig, data: CatalogWrite) {
  return api<{ data: CatalogDto }>(paths[tabela], { method: "POST", body: JSON.stringify(data) });
}
export function updateCatalog(
  tabela: TabelaConfig,
  id: string,
  data: Partial<CatalogWrite> & { ativo?: boolean },
) {
  return api<{ data: CatalogDto }>(`${paths[tabela]}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
