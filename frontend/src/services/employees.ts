import { api } from "@/lib/api/client";
import { withParams, type Page, type Params } from "@/lib/api/types";
import type { Classificacao, Colaborador } from "@/lib/dados";

type EmployeeDto = {
  id: string;
  codigoCorporativo: string;
  nome: string;
  contato: string | null;
  obraId: string;
  funcaoId: string;
  ativo: boolean;
  obra: { nome: string };
  funcao: { nome: string };
};
export type EmployeeCreate = {
  codigoCorporativo: string;
  nome: string;
  contato?: string;
  obraId: string;
  funcaoId: string;
};
export type EmployeeUpdate = {
  nome?: string;
  contato?: string | null;
  obraId?: string;
  funcaoId?: string;
};
export type EmployeeHistoryItem = {
  id: string;
  dataAfastamento: string;
  dataRetornoPrevista: string | null;
  dataRetornoEfetiva: string | null;
  obra: { nome: string };
  funcao: { nome: string };
  situacao: { nome: string; classificacao: Classificacao };
  tipoBeneficio: { nome: string } | null;
};
function mapEmployee(item: EmployeeDto): Colaborador {
  return {
    id: item.id,
    codigo_interno: item.codigoCorporativo,
    nome: item.nome,
    contato: item.contato,
    obra_id: item.obraId,
    funcao_id: item.funcaoId,
    ativo: item.ativo,
    obras: item.obra,
    funcoes: item.funcao,
  };
}
export async function listEmployees(params: Params = {}): Promise<Page<Colaborador>> {
  const response = await api<Page<EmployeeDto>>(withParams("/colaboradores", params));
  return { ...response, data: response.data.map(mapEmployee) };
}
export async function getEmployee(id: string) {
  const response = await api<{ data: EmployeeDto }>(`/colaboradores/${id}`);
  return mapEmployee(response.data);
}
export async function employeeHistory(
  id: string,
  params: Params,
): Promise<Page<EmployeeHistoryItem>> {
  const response = await api<{
    data: { afastamentos: EmployeeHistoryItem[] };
    meta: Page<EmployeeHistoryItem>["meta"];
  }>(withParams(`/colaboradores/${id}/historico`, params));
  return { data: response.data.afastamentos, meta: response.meta };
}
export function createEmployee(data: EmployeeCreate) {
  return api<{ data: EmployeeDto }>("/colaboradores", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function updateEmployee(id: string, data: EmployeeUpdate) {
  return api<{ data: EmployeeDto }>(`/colaboradores/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
export function setEmployeeActive(id: string, active: boolean) {
  return api<{ data: EmployeeDto }>(`/colaboradores/${id}/${active ? "ativar" : "inativar"}`, {
    method: "POST",
  });
}
