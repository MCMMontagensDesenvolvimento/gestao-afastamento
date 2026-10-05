import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/components/AppLayout";
import { AfastamentoForm } from "@/components/AfastamentoForm";

export const Route = createFileRoute("/afastamentos/novo")({
  head: () => ({
    meta: [
      { title: "Novo afastamento — Controle de Afastamentos MCM" },
      {
        name: "description",
        content: "Cadastre um novo afastamento de colaborador com benefício, situação e datas.",
      },
      { property: "og:title", content: "Novo afastamento — Controle de Afastamentos MCM" },
      {
        property: "og:description",
        content: "Formulário de cadastro de afastamento de colaborador.",
      },
    ],
  }),
  component: PaginaNovoAfastamento,
});

function PaginaNovoAfastamento() {
  return (
    <AppLayout titulo="Novo afastamento" descricao="Preencha os dados do afastamento.">
      <AfastamentoForm />
    </AppLayout>
  );
}
