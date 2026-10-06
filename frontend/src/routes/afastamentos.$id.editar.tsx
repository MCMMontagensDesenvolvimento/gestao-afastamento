import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/session";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { afastamentoQuery } from "@/hooks/use-leaves";

import { AppLayout } from "@/components/AppLayout";
import { AfastamentoForm } from "@/components/AfastamentoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoErro, EstadoVazio } from "@/components/padroes";

export const Route = createFileRoute("/afastamentos/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar afastamento — Controle de Afastamentos MCM" },
      {
        name: "description",
        content: "Altere os dados, o benefício e a situação de um afastamento registrado.",
      },
      { property: "og:title", content: "Editar afastamento — Controle de Afastamentos MCM" },
      {
        property: "og:description",
        content: "Formulário de edição de afastamento de colaborador.",
      },
    ],
  }),
  component: PaginaEditarAfastamento,
});

function PaginaEditarAfastamento() {
  const { id } = useParams({ from: "/afastamentos/$id/editar" });
  const { can } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    ...afastamentoQuery(id),
    enabled: can("leaves.read"),
  });

  if (!can("leaves.update") || !can("leaves.read"))
    return (
      <AppLayout titulo="Editar afastamento">
        <EstadoVazio
          titulo="Acesso negado"
          descricao="Você não possui permissão para editar afastamentos."
        />
      </AppLayout>
    );

  return (
    <AppLayout titulo="Editar afastamento" descricao={data?.colaboradores?.nome ?? ""}>
      {isLoading ? (
        <div className="max-w-4xl space-y-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : error instanceof ApiError && error.status === 404 ? (
        <EstadoVazio
          titulo="Afastamento não encontrado."
          descricao="Verifique o endereço informado."
        />
      ) : isError ? (
        <EstadoErro mensagem={errorMessage(error)} aoTentarNovamente={() => refetch()} />
      ) : !data ? (
        <EstadoVazio
          titulo="Afastamento não encontrado."
          descricao="O registro pode ter sido removido ou o endereço está incorreto."
        />
      ) : (
        <AfastamentoForm key={data.id} afastamento={data} />
      )}
    </AppLayout>
  );
}
