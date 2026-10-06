import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth/session";
import { errorMessage } from "@/lib/api/errors";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { leavesPageQuery, leaveCountsQuery } from "@/hooks/use-leaves";
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
} from "@/components/padroes";
import {
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
  const { can } = useAuth();
  const pag = useServerPagination();
  const obrasRes = useQuery(configQuery("obras", false));
  const obras = obrasRes.data ?? [];
  const funcoesRes = useQuery(configQuery("funcoes", false));
  const funcoes = funcoesRes.data ?? [];
  const beneficiosRes = useQuery(configQuery("tipos_beneficio", false));
  const beneficios = beneficiosRes.data ?? [];
  const situacoesRes = useQuery(configQuery("situacoes_afastamento", false));
  const situacoes = situacoesRes.data ?? [];

  const [busca, setBusca] = useState("");
  const [obraId, setObraId] = useState(TODOS);
  const [funcaoId, setFuncaoId] = useState(TODOS);
  const [beneficioId, setBeneficioId] = useState(TODOS);
  const [situacaoId, setSituacaoId] = useState(TODOS);
  const [aba, setAba] = useState<"TODOS" | Classificacao>("TODOS");

  const params = {
    page: pag.pagina,
    perPage: pag.tamanho,
    search: busca.trim(),
    obraId: obraId === TODOS ? undefined : obraId,
    funcaoId: funcaoId === TODOS ? undefined : funcaoId,
    tipoBeneficioId: beneficioId === TODOS ? undefined : beneficioId,
    situacaoId: situacaoId === TODOS ? undefined : situacaoId,
    classificacao: aba === "TODOS" ? undefined : aba,
    sortDirection: "desc",
  };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    ...leavesPageQuery(params),
    enabled: can("leaves.read"),
  });
  const counts = useQuery({ ...leaveCountsQuery(), enabled: can("leaves.read") });
  const lista = data?.data ?? [];
  const erroFiltros = [obrasRes, funcoesRes, beneficiosRes, situacoesRes].find(
    (query) => query.isError,
  );
  const contagem = counts.data;
  const alterar = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    pag.setPagina(1);
  };

  const filtrosAtivos = [obraId, funcaoId, beneficioId, situacaoId].filter(
    (v) => v !== TODOS,
  ).length;
  function limpar() {
    pag.setPagina(1);
    setBusca("");
    setObraId(TODOS);
    setFuncaoId(TODOS);
    setBeneficioId(TODOS);
    setSituacaoId(TODOS);
  }

  const cards = [
    { rotulo: "Ativos", valor: contagem?.ATIVO ?? "—" },
    { rotulo: "Encerrados", valor: contagem?.ENCERRADO ?? "—" },
    { rotulo: "Aposentados", valor: contagem?.APOSENTADO ?? "—" },
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
    ...(can("leaves.update")
      ? [
          {
            rotulo: "Editar",
            icone: Pencil,
            aoClicar: () => navigate({ to: "/afastamentos/$id/editar", params: { id: a.id } }),
          },
        ]
      : []),
  ];

  const temFiltro = filtrosAtivos > 0 || busca.trim() !== "" || aba !== "TODOS";

  if (!can("leaves.read"))
    return (
      <AppLayout titulo="Afastados">
        <EstadoVazio
          titulo="Acesso negado"
          descricao="Você não possui permissão para consultar afastamentos."
        />
      </AppLayout>
    );

  return (
    <AppLayout
      titulo="Afastados"
      descricao="Colaboradores com afastamento registrado."
      acoes={
        can("leaves.create") ? (
          <Button asChild>
            <Link to="/afastamentos/novo">
              <Plus className="size-4" /> Novo afastamento
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.rotulo} className="rounded-md border border-border bg-card px-3 py-3 sm:px-4">
            <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
              {c.rotulo}
            </p>
            {counts.isLoading ? (
              <Skeleton className="mt-2 h-7 w-10" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums">{c.valor}</p>
            )}
          </div>
        ))}
      </div>

      {erroFiltros ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Os filtros de cadastro estão indisponíveis. {errorMessage(erroFiltros.error)}
        </p>
      ) : null}
      <div className="mt-5">
        <BarraFiltros
          busca={busca}
          aoBuscar={alterar(setBusca)}
          placeholderBusca="Nome do colaborador"
          filtrosAtivos={filtrosAtivos}
          aoLimpar={limpar}
        >
          <FiltroSelect
            id="f-obra"
            rotulo="Obra"
            valor={obraId}
            aoMudar={alterar(setObraId)}
            itens={obras}
          />
          <FiltroSelect
            id="f-funcao"
            rotulo="Função"
            valor={funcaoId}
            aoMudar={alterar(setFuncaoId)}
            itens={funcoes}
          />
          <FiltroSelect
            id="f-beneficio"
            rotulo="Tipo de benefício"
            valor={beneficioId}
            aoMudar={alterar(setBeneficioId)}
            itens={beneficios}
            rotuloTodos="Todos"
          />
          <FiltroSelect
            id="f-situacao"
            rotulo="Situação"
            valor={situacaoId}
            aoMudar={alterar(setSituacaoId)}
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
            onClick={() => {
              setAba(p.chave);
              pag.setPagina(1);
            }}
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

      {counts.isError ? (
        <EstadoErro
          mensagem="Não foi possível carregar os totais."
          aoTentarNovamente={() => counts.refetch()}
        />
      ) : null}
      {isFetching && !isLoading ? (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Atualizando afastamentos…
        </p>
      ) : null}
      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
        {isLoading ? (
          <TabelaSkeleton />
        ) : isError ? (
          <EstadoErro
            className="m-4"
            mensagem={errorMessage(error)}
            aoTentarNovamente={() => refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="m-4"
            titulo={
              temFiltro
                ? "Nenhum afastamento corresponde aos filtros."
                : "Nenhum afastamento registrado."
            }
            descricao={
              temFiltro
                ? "Ajuste ou limpe os filtros para ver mais resultados."
                : "Cadastre o primeiro afastamento para começar o acompanhamento."
            }
            acao={
              temFiltro ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    limpar();
                    setAba("TODOS");
                  }}
                >
                  Limpar filtros
                </Button>
              ) : can("leaves.create") ? (
                <Button asChild size="sm">
                  <Link to="/afastamentos/novo">
                    <Plus className="size-4" /> Novo afastamento
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Celular: cartões */}
            <ul className="divide-y divide-border md:hidden">
              {lista.map((a) => (
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
                      <span className="text-muted-foreground">
                        Afastado em {formatarData(a.data_afastamento)}
                      </span>
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
                    <TableHead className="hidden whitespace-nowrap lg:table-cell">
                      Fim do benefício
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {a.colaboradores?.nome ?? "—"}
                      </TableCell>
                      <TableCell>{a.obras?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {a.funcoes?.nome ?? "—"}
                      </TableCell>
                      <TableCell
                        className="hidden max-w-[240px] truncate 2xl:table-cell"
                        title={nomeBeneficio(a)}
                      >
                        {nomeBeneficio(a)}
                      </TableCell>
                      <TableCell>
                        <SituacaoBadge a={a} />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatarData(a.data_afastamento)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">
                        {formatarData(a.data_fim_beneficio)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AcoesLinha acoes={acoesDe(a)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginacao
              {...pag}
              total={data?.meta.total ?? 0}
              totalPaginas={data?.meta.totalPages ?? 1}
            />
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
