import { api } from "@/lib/api/client";
import { withParams, type Page, type Params } from "@/lib/api/types";
import type { Afastamento, Classificacao } from "@/lib/dados";

export interface LeaveDto {
  id: string;
  colaboradorId: string;
  obraId: string;
  funcaoId: string;
  situacaoId: string;
  tipoBeneficioId: string | null;
  dataAfastamento: string;
  dataFimBeneficio: string | null;
  dataRetornoPrevista: string | null;
  dataRetornoEfetiva: string | null;
  causaCid: string | null;
  observacoes: string | null;
  colaborador: { nome: string; codigoCorporativo: string };
  obra: { nome: string };
  funcao: { nome: string };
  tipoBeneficio: { nome: string; codigo?: string | null } | null;
  situacao: { nome: string; classificacao: Classificacao };
}

export interface LeaveInput {
  colaboradorId: string;
  obraId: string;
  funcaoId: string;
  situacaoId: string;
  tipoBeneficioId: string | null;
  dataAfastamento: string;
  dataFimBeneficio: string | null;
  dataRetornoPrevista: string | null;
  dataRetornoEfetiva: string | null;
  causaCid: string | null;
  observacoes: string | null;
}

/** Mantém o modelo de apresentação existente e concentra a tradução do contrato. */
export function mapLeave(item: LeaveDto): Afastamento {
  return {
    id: item.id,
    colaborador_id: item.colaboradorId,
    obra_id: item.obraId,
    funcao_id: item.funcaoId,
    situacao_afastamento_id: item.situacaoId,
    tipo_beneficio_id: item.tipoBeneficioId,
    data_afastamento: item.dataAfastamento,
    data_fim_beneficio: item.dataFimBeneficio,
    data_retorno_previsto: item.dataRetornoPrevista,
    data_retorno_efetivo: item.dataRetornoEfetiva,
    causa_cid: item.causaCid,
    observacoes: item.observacoes,
    colaboradores: {
      nome: item.colaborador.nome,
      codigo_interno: item.colaborador.codigoCorporativo,
    },
    obras: item.obra,
    funcoes: item.funcao,
    tipos_beneficio: item.tipoBeneficio
      ? { nome: item.tipoBeneficio.nome, codigo: item.tipoBeneficio.codigo ?? null }
      : null,
    situacoes_afastamento: {
      nome: item.situacao.nome,
      classificacao_sistema: item.situacao.classificacao,
    },
  };
}

export async function listLeaves(params: Params): Promise<Page<Afastamento>> {
  const result = await api<Page<LeaveDto>>(withParams("/afastamentos", params));
  return { ...result, data: result.data.map(mapLeave) };
}

export async function getLeave(id: string): Promise<Afastamento> {
  const result = await api<{ data: LeaveDto }>(`/afastamentos/${id}`);
  return mapLeave(result.data);
}

export async function saveLeave(input: LeaveInput, id?: string): Promise<Afastamento> {
  const result = await api<{ data: LeaveDto }>(id ? `/afastamentos/${id}` : "/afastamentos", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(input),
  });
  return mapLeave(result.data);
}

export async function countLeavesByClassification(): Promise<Record<Classificacao, number>> {
  const values = await Promise.all(
    (["ATIVO", "ENCERRADO", "APOSENTADO"] as const).map(async (classificacao) => {
      const result = await api<Page<LeaveDto>>(
        withParams("/afastamentos", { classificacao, page: 1, perPage: 10 }),
      );
      return [classificacao, result.meta.total] as const;
    }),
  );
  return { ATIVO: values[0]![1], ENCERRADO: values[1]![1], APOSENTADO: values[2]![1] };
}
