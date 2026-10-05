import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Classificacao = "ATIVO" | "ENCERRADO" | "APOSENTADO";

export interface ItemSimples {
  id: string;
  nome: string;
  ativo: boolean;
  ordem_exibicao?: number;
  codigo?: string | null;
  classificacao_sistema?: Classificacao;
}

export interface Colaborador {
  id: string;
  codigo_interno: string;
  nome: string;
  contato: string | null;
  data_nascimento: string | null;
  data_admissao: string | null;
  obra_id: string | null;
  funcao_id: string | null;
  ativo: boolean;
  obras?: { nome: string } | null;
  funcoes?: { nome: string } | null;
}

export interface Afastamento {
  id: string;
  colaborador_id: string;
  obra_id: string | null;
  funcao_id: string | null;
  data_afastamento: string;
  tipo_beneficio_id: string | null;
  situacao_afastamento_id: string;
  data_inicio_beneficio: string | null;
  data_fim_beneficio: string | null;
  data_retorno_previsto: string | null;
  data_retorno_efetivo: string | null;
  data_aposentadoria: string | null;
  causa_cid: string | null;
  observacoes: string | null;
  colaboradores?: { nome: string; codigo_interno: string } | null;
  obras?: { nome: string } | null;
  funcoes?: { nome: string } | null;
  tipos_beneficio?: { nome: string; codigo: string | null } | null;
  situacoes_afastamento?: { nome: string; classificacao_sistema: Classificacao } | null;
}
export interface Andamento { id: string; afastamento_id: string; data_andamento: string; tipo_andamento_id: string; descricao: string; proxima_acao: string | null; data_proxima_acao: string | null; tipos_andamento_afastamento?: { nome: string } | null; }
export interface DocumentoAfastamento { id: string; afastamento_id: string; andamento_id: string | null; tipo_documento_id: string; data_documento: string; nome_arquivo: string; storage_path: string; tipos_documento_afastamento?: { nome: string } | null; }

/** Tabelas de configuração usadas nos dropdowns e na tela de Configurações. */
export const TABELAS_CONFIG = [
  "obras",
  "funcoes",
  "tipos_beneficio",
  "situacoes_afastamento",
  "tipos_andamento_afastamento",
  "tipos_documento_afastamento",
] as const;

export type TabelaConfig = (typeof TABELAS_CONFIG)[number];

function ordenacao(tabela: TabelaConfig) {
  return tabela === "obras" || tabela === "funcoes" ? "nome" : "ordem_exibicao";
}

async function listarConfig(tabela: TabelaConfig, apenasAtivos: boolean) {
  let q = supabase.from(tabela).select("*").order(ordenacao(tabela), { ascending: true });
  if (apenasAtivos) q = q.eq("ativo", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ItemSimples[];
}

export const configQuery = (tabela: TabelaConfig, apenasAtivos = true) =>
  queryOptions({
    queryKey: ["config", tabela, apenasAtivos],
    queryFn: () => listarConfig(tabela, apenasAtivos),
  });

export const colaboradoresQuery = (apenasAtivos = false) =>
  queryOptions({
    queryKey: ["colaboradores", apenasAtivos],
    queryFn: async () => {
      let q = supabase
        .from("colaboradores")
        .select("*, obras(nome), funcoes(nome)")
        .order("nome", { ascending: true });
      if (apenasAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Colaborador[];
    },
  });

const SELECT_AFASTAMENTO =
  "*, colaboradores(nome, codigo_interno), obras(nome), funcoes(nome), tipos_beneficio(nome, codigo), situacoes_afastamento(nome, classificacao_sistema)";

export const afastamentosQuery = () =>
  queryOptions({
    queryKey: ["afastamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afastamentos")
        .select(SELECT_AFASTAMENTO)
        .order("data_afastamento", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Afastamento[];
    },
  });

export const afastamentoQuery = (id: string) =>
  queryOptions({
    queryKey: ["afastamento", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afastamentos")
        .select(SELECT_AFASTAMENTO)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Afastamento | null;
    },
  });
export const andamentosQuery = (afastamentoId: string) => queryOptions({ queryKey: ["andamentos", afastamentoId], queryFn: async () => { const { data, error } = await supabase.from("afastamento_andamentos").select("*, tipos_andamento_afastamento(nome)").eq("afastamento_id", afastamentoId).order("data_andamento", { ascending: false }).order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as unknown as Andamento[]; } });
export const documentosQuery = (afastamentoId: string) => queryOptions({ queryKey: ["documentos", afastamentoId], queryFn: async () => { const { data, error } = await supabase.from("afastamento_documentos").select("*, tipos_documento_afastamento(nome)").eq("afastamento_id", afastamentoId).order("data_documento", { ascending: false }); if (error) throw error; return (data ?? []) as unknown as DocumentoAfastamento[]; } });
export const proximasAcoesQuery = () => queryOptions({ queryKey: ["proximas-acoes"], queryFn: async () => { const { data, error } = await supabase.from("afastamento_andamentos").select("*, afastamentos(id, colaboradores(nome))").not("data_proxima_acao", "is", null).order("data_proxima_acao", { ascending: true }); if (error) throw error; return data ?? []; } });

/** Conta afastamentos por colaborador — usado para impedir exclusão com vínculos. */
export const contagemAfastamentosQuery = () =>
  queryOptions({
    queryKey: ["contagem-afastamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("afastamentos").select("colaborador_id");
      if (error) throw error;
      const mapa: Record<string, number> = {};
      for (const linha of data ?? []) {
        const id = (linha as { colaborador_id: string }).colaborador_id;
        mapa[id] = (mapa[id] ?? 0) + 1;
      }
      return mapa;
    },
  });

export function formatarData(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  ATIVO: "Ativo",
  ENCERRADO: "Encerrado",
  APOSENTADO: "Aposentado",
};

export function corDaClassificacao(c?: Classificacao) {
  if (c === "ATIVO") return "bg-primary/10 text-primary border-primary/30";
  if (c === "APOSENTADO") return "bg-secondary text-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}
