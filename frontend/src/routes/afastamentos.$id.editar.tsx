import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "@/components/AppLayout";
import { AfastamentoForm } from "@/components/AfastamentoForm";
import { afastamentoQuery } from "@/lib/dados";
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
  const { data, isLoading, isError, refetch } = useQuery(afastamentoQuery(id));

  return (
    <AppLayout titulo="Editar afastamento" descricao={data?.colaboradores?.nome ?? ""}>
      {isLoading ? (
        <div className="max-w-4xl space-y-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EstadoErro mensagem="Não foi possível carregar o afastamento." aoTentarNovamente={() => refetch()} />
      ) : !data ? (
        <EstadoVazio
          titulo="Afastamento não encontrado."
          descricao="O registro pode ter sido removido ou o endereço está incorreto."
        />
      ) : (
        <AfastamentoForm afastamento={data} />
      )}
    </AppLayout>
  );
}
