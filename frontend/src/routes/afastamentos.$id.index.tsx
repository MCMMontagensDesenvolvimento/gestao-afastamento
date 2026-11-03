import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/session";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { afastamentoQuery } from "@/hooks/use-leaves";
import { ArrowLeft, Pencil, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoErro, EstadoVazio, Secao } from "@/components/padroes";

import { AppLayout } from "@/components/AppLayout";
import { AfastamentoDocumentos } from "@/components/AfastamentoDocumentos";
import { AfastamentoHistorico } from "@/components/AfastamentoHistorico";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { corDaClassificacao, formatarData } from "@/lib/dados";
import { HistoricoSituacoesApdata } from "@/components/HistoricoSituacoesApdata";

export const Route = createFileRoute("/afastamentos/$id/")({
  head: () => ({
    meta: [
      { title: "Detalhe do afastamento — Controle de Afastamentos MCM" },
      {
        name: "description",
        content: "Consulte os dados completos de um afastamento: benefício, situação e datas.",
      },
      { property: "og:title", content: "Detalhe do afastamento — Controle de Afastamentos MCM" },
      {
        property: "og:description",
        content: "Ficha completa do afastamento do colaborador.",
      },
    ],
  }),
  component: PaginaDetalhe,
});

function PaginaDetalhe() {
  const { id } = useParams({ from: "/afastamentos/$id/" });
  const { can } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    ...afastamentoQuery(id),
    enabled: can("leaves.read"),
  });

  const voltar = (
    <Button asChild variant="outline">
      <Link to="/">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
    </Button>
  );

  if (!can("leaves.read"))
    return (
      <AppLayout titulo="Afastamento">
        <EstadoVazio
          titulo="Acesso negado"
          descricao="Você não possui permissão para consultar afastamentos."
        />
      </AppLayout>
    );
  if (error instanceof ApiError && error.status === 404)
    return (
      <AppLayout titulo="Afastamento" acoes={voltar}>
        <EstadoVazio
          titulo="Afastamento não encontrado."
          descricao="Verifique o endereço informado."
        />
      </AppLayout>
    );

  if (isLoading) {
    return (
      <AppLayout titulo="Afastamento" descricao="Carregando dados…">
        <div className="space-y-5" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout titulo="Afastamento" acoes={voltar}>
        <EstadoErro mensagem={errorMessage(error)} aoTentarNovamente={() => refetch()} />
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout titulo="Afastamento" acoes={voltar}>
        <EstadoVazio
          titulo="Afastamento não encontrado."
          descricao="O registro pode ter sido removido ou o endereço está incorreto."
          acao={voltar}
        />
      </AppLayout>
    );
  }

  const beneficio = data.tipos_beneficio
    ? `${data.tipos_beneficio.codigo ?? ""} ${data.tipos_beneficio.nome}`.trim()
    : "—";

  return (
    <AppLayout
      titulo={data.colaboradores?.nome ?? "Afastamento"}
      descricao={data.colaboradores?.codigo_interno ?? ""}
      acoes={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar 
            </Link>
          </Button>

          {can("leaves.update") ? (
            <Button asChild>
              <Link to="/afastamentos/$id/editar" params={{ id }}>
                <Pencil className="size-4" />
                Editar afastamento
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="rounded-md border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${corDaClassificacao(
              data.situacoes_afastamento?.classificacao_sistema,
            )}`}
          >
            {data.situacoes_afastamento?.nome ?? "—"}
          </span>
          <span className="min-w-0 text-sm text-muted-foreground">
            {data.obras?.nome ?? "—"} · {data.funcoes?.nome ?? "—"} · {beneficio}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <Campo
            rotulo="Afastamento"
            valor={`${formatarData(data.data_afastamento)} até ${formatarData(data.data_fim_beneficio)}`}
          />{" "}
          <Campo rotulo="Fim do benefício" valor={formatarData(data.data_fim_beneficio)} />
          <Campo rotulo="Retorno previsto" valor={formatarData(data.data_retorno_previsto)} />
        </dl>
      </div>

      <Tabs defaultValue="dados" className="mt-5">
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          {can("progress.read") ? <TabsTrigger value="historico">Histórico</TabsTrigger> : null}
          {can("documents.read") ? <TabsTrigger value="documentos">Documentos</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="dados">
          <Secao titulo="Dados do afastamento">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Campo rotulo="Data do afastamento" valor={formatarData(data.data_afastamento)} />
              <Campo rotulo="Tipo de benefício" valor={beneficio} />
              <Campo rotulo="Situação" valor={data.situacoes_afastamento?.nome ?? "—"} />
              <Campo rotulo="Fim do benefício" valor={formatarData(data.data_fim_beneficio)} />
              <Campo rotulo="Retorno previsto" valor={formatarData(data.data_retorno_previsto)} />
              <Campo rotulo="Retorno efetivo" valor={formatarData(data.data_retorno_efetivo)} />
              <Campo rotulo="Obra" valor={data.obras?.nome ?? "—"} />
              <Campo rotulo="Função" valor={data.funcoes?.nome ?? "—"} />
              <Campo rotulo="Causa / CID" valor={data.causa_cid || "—"} />
              <Campo rotulo="Observações" valor={data.observacoes || "—"} />
            </dl>
          </Secao>
        </TabsContent>
        <TabsContent
          value="historico"
          className="rounded-md border border-border bg-card p-4 sm:p-5"
        >
          {data.colaboradores?.nome ? (
            <HistoricoSituacoesApdata colaboradorNome={data.colaboradores.nome} />
          ) : (
            <EstadoVazio
              titulo="Colaborador não identificado."
              descricao="Não foi possível localizar o nome do colaborador deste afastamento."
            />
          )}

          {can("progress.read") ? (
            <div className="mt-6 border-t border-border pt-5">
              <AfastamentoHistorico afastamentoId={id} />
            </div>
          ) : null}
        </TabsContent>
        <TabsContent
          value="documentos"
          className="rounded-md border border-border bg-card p-4 sm:p-5"
        >
          {can("documents.read") ? <AfastamentoDocumentos afastamentoId={id} /> : null}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm tabular-nums">{valor}</dd>
    </div>
  );
}
