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
  cpf: string;
  id: string;
  codigo_interno: string;
  nome: string;
  contato: string | null;
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
  data_fim_beneficio: string | null;
  data_retorno_previsto: string | null;
  data_retorno_efetivo: string | null;
  causa_cid: string | null;
  observacoes: string | null;
  colaboradores?: { nome: string; codigo_interno: string } | null;
  obras?: { nome: string } | null;
  funcoes?: { nome: string } | null;
  tipos_beneficio?: { nome: string; codigo: string | null } | null;
  situacoes_afastamento?: { nome: string; classificacao_sistema: Classificacao } | null;
}
export interface Andamento {
  id: string;
  afastamento_id: string;
  data_andamento: string;
  tipo_andamento_id: string;
  descricao: string;
  proxima_acao: string | null;
  data_proxima_acao: string | null;
  tipos_andamento_afastamento?: { nome: string } | null;
}

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

export { configQuery } from "@/hooks/use-catalogs";
export { colaboradoresQuery } from "@/hooks/use-employees";
