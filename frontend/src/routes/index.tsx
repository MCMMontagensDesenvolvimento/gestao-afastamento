import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AcoesLinha,
  BarraFiltros,
  CABECALHO_FIXO,
  EstadoErro,
  EstadoVazio,
  FiltroSelect,
  Paginacao,
  TABELA_CONTAINER,
  TabelaSkeleton,
  TODOS,
  usePaginacao,
} from "@/components/padroes";
import {
  afastamentosQuery,
  configQuery,
  corDaClassificacao,
  formatarData,
  type Afastamento,
  type Classificacao,
} from "@/lib/dados";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afastados — Controle de Afastamentos MCM" },
      {
        name: "description",
        content:
          "Acompanhe os afastamentos de colaboradores por obra, função, tipo de benefício e situação.",
      },
      { property: "og:title", content: "Afastados — Controle de Afastamentos MCM" },
      {
        property: "og:description",
        content: "Painel de afastamentos ativos, encerrados e aposentadorias.",
      },
    ],
  }),
  component: PaginaAfastados,
});

function PaginaAfastados() {
  const navigate = useNavigate();
  const {
    data: afastamentos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(afastamentosQuery());
  const { data: obras = [] } = useQuery(configQuery("obras", false));
  const { data: funcoes = [] } = useQuery(configQuery("funcoes", false));
  const { data: beneficios = [] } = useQuery(configQuery("tipos_beneficio", false));
  const { data: situacoes = [] } = useQuery(configQuery("situacoes_afastamento", false));

  const [busca, setBusca] = useState("");
  const [obraId, setObraId] = useState(TODOS);
  const [funcaoId, setFuncaoId] = useState(TODOS);
  const [beneficioId, setBeneficioId] = useState(TODOS);
  const [situacaoId, setSituacaoId] = useState(TODOS);
  const [aba, setAba] = useState<"TODOS" | Classificacao>("TODOS");

  const contagem = useMemo(() => {
    const base = { ATIVO: 0, ENCERRADO: 0, APOSENTADO: 0 };
    for (const a of afastamentos) {
      const c = a.situacoes_afastamento?.classificacao_sistema;
      if (c) base[c] += 1;
    }
    return base;
  }, [afastamentos]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return afastamentos.filter((a) => {
      if (termo && !(a.colaboradores?.nome ?? "").toLowerCase().includes(termo)) return false;
      if (obraId !== TODOS && a.obra_id !== obraId) return false;
      if (funcaoId !== TODOS && a.funcao_id !== funcaoId) return false;
      if (beneficioId !== TODOS && a.tipo_beneficio_id !== beneficioId) return false;
      if (situacaoId !== TODOS && a.situacao_afastamento_id !== situacaoId) return false;
      if (aba !== "TODOS" && a.situacoes_afastamento?.classificacao_sistema !== aba) return false;
      return true;
    });
  }, [afastamentos, busca, obraId, funcaoId, beneficioId, situacaoId, aba]);

  const pag = usePaginacao(lista);

  const filtrosAtivos = [obraId, funcaoId, beneficioId, situacaoId].filter((v) => v !== TODOS).length;
  function limpar() {
    setBusca("");
    setObraId(TODOS);
    setFuncaoId(TODOS);
    setBeneficioId(TODOS);
    setSituacaoId(TODOS);
  }

  const cards = [
    { rotulo: "Ativos", valor: contagem.ATIVO },
    { rotulo: "Encerrados", valor: contagem.ENCERRADO },
    { rotulo: "Aposentados", valor: contagem.APOSENTADO },
  ];

  const pills: Array<{ chave: "TODOS" | Classificacao; rotulo: string }> = [
    { chave: "TODOS", rotulo: "Todos" },
    { chave: "ATIVO", rotulo: "Ativos" },
    { chave: "ENCERRADO", rotulo: "Encerrados" },
    { chave: "APOSENTADO", rotulo: "Aposentados" },
  ];

  const nomeBeneficio = (a: Afastamento) =>
    a.tipos_beneficio ? `${a.tipos_beneficio.codigo ?? ""} ${a.tipos_beneficio.nome}`.trim() : "—";

  const acoesDe = (a: Afastamento) => [
    {
      rotulo: "Visualizar",
      icone: Eye,
      aoClicar: () => navigate({ to: "/afastamentos/$id", params: { id: a.id } }),
    },
    {
      rotulo: "Editar",
      icone: Pencil,
      aoClicar: () => navigate({ to: "/afastamentos/$id/editar", params: { id: a.id } }),
    },
  ];

  const temFiltro = filtrosAtivos > 0 || busca.trim() !== "" || aba !== "TODOS";

  return (
    <AppLayout
      titulo="Afastados"
      descricao="Colaboradores com afastamento registrado."
      acoes={
        <Button asChild>
          <Link to="/afastamentos/novo">
            <Plus className="size-4" /> Novo afastamento
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.rotulo} className="rounded-md border border-border bg-card px-3 py-3 sm:px-4">
            <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{c.rotulo}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-10" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums">{c.valor}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <BarraFiltros
          busca={busca}
          aoBuscar={setBusca}
          placeholderBusca="Nome do colaborador"
          filtrosAtivos={filtrosAtivos}
          aoLimpar={limpar}
        >
          <FiltroSelect id="f-obra" rotulo="Obra" valor={obraId} aoMudar={setObraId} itens={obras} />
          <FiltroSelect id="f-funcao" rotulo="Função" valor={funcaoId} aoMudar={setFuncaoId} itens={funcoes} />
          <FiltroSelect
            id="f-beneficio"
            rotulo="Tipo de benefício"
            valor={beneficioId}
            aoMudar={setBeneficioId}
            itens={beneficios}
            rotuloTodos="Todos"
          />
          <FiltroSelect
            id="f-situacao"
            rotulo="Situação"
            valor={situacaoId}
            aoMudar={setSituacaoId}
            itens={situacoes}
          />
        </BarraFiltros>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Classificação">
        {pills.map((p) => (
          <button
            key={p.chave}
            type="button"
            role="tab"
            aria-selected={aba === p.chave}
            onClick={() => setAba(p.chave)}
            className={`min-h-9 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              aba === p.chave
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
        {isLoading ? (
          <TabelaSkeleton />
        ) : isError ? (
          <EstadoErro
            className="m-4"
            mensagem="Não foi possível carregar os afastamentos."
            aoTentarNovamente={() => refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="m-4"
            titulo={temFiltro ? "Nenhum afastamento corresponde aos filtros." : "Nenhum afastamento registrado."}
            descricao={temFiltro ? "Ajuste ou limpe os filtros para ver mais resultados." : "Cadastre o primeiro afastamento para começar o acompanhamento."}
            acao={
              temFiltro ? (
                <Button variant="outline" size="sm" onClick={() => { limpar(); setAba("TODOS"); }}>
                  Limpar filtros
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/afastamentos/novo">
                    <Plus className="size-4" /> Novo afastamento
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Celular: cartões */}
            <ul className="divide-y divide-border md:hidden">
              {pag.visiveis.map((a) => (
                <li key={a.id} className="flex items-start gap-2 p-4">
                  <Link
                    to="/afastamentos/$id"
                    params={{ id: a.id }}
                    className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="truncate font-medium">{a.colaboradores?.nome ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.obras?.nome ?? "—"} · {a.funcoes?.nome ?? "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <SituacaoBadge a={a} />
                      <span className="text-muted-foreground">Afastado em {formatarData(a.data_afastamento)}</span>
                    </div>
                  </Link>
                  <AcoesLinha acoes={acoesDe(a)} compacto />
                </li>
              ))}
            </ul>

            {/* Tablet e desktop: tabela */}
            <div className="hidden md:block">
              <Table containerClassName={TABELA_CONTAINER}>
                <TableHeader className={CABECALHO_FIXO}>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead className="hidden lg:table-cell">Função</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Tipo de benefício</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="whitespace-nowrap">Afastamento</TableHead>
                    <TableHead className="hidden whitespace-nowrap xl:table-cell">Início do benefício</TableHead>
                    <TableHead className="hidden whitespace-nowrap lg:table-cell">Fim do benefício</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pag.visiveis.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="max-w-[220px] truncate font-medium">{a.colaboradores?.nome ?? "—"}</TableCell>
                      <TableCell>{a.obras?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{a.funcoes?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden max-w-[240px] truncate 2xl:table-cell" title={nomeBeneficio(a)}>{nomeBeneficio(a)}</TableCell>
                      <TableCell><SituacaoBadge a={a} /></TableCell>
                      <TableCell className="tabular-nums">{formatarData(a.data_afastamento)}</TableCell>
                      <TableCell className="hidden tabular-nums xl:table-cell">{formatarData(a.data_inicio_beneficio)}</TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">{formatarData(a.data_fim_beneficio)}</TableCell>
                      <TableCell className="text-right">
                        <AcoesLinha acoes={acoesDe(a)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginacao {...pag} />
          </>
        )}
      </div>
    </AppLayout>
  );
}

function SituacaoBadge({ a }: { a: Afastamento }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${corDaClassificacao(
        a.situacoes_afastamento?.classificacao_sistema,
      )}`}
    >
      {a.situacoes_afastamento?.nome ?? "—"}
    </span>
  );
}
