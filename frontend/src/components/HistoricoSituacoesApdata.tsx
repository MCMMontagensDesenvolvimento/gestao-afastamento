import { useQuery } from "@tanstack/react-query";
import { listarContratadosApdata, type ApdataSituacao } from "@/services/employees";
import { EstadoErro, EstadoVazio, ListaSkeleton } from "@/components/padroes";
import { errorMessage } from "@/lib/api/errors";

function normalizarNome(nome: string) {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarDataApdata(data: string | null) {
  if (!data) return "Atual";

  const dataParte = data.split(" ")[0];

  if (!dataParte) return "Data inválida";

  const partes = dataParte.split("-");

  if (partes.length !== 3) return "Data inválida";

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export function HistoricoSituacoesApdata({
  colaboradorNome,
}: {
  colaboradorNome: string;
}) {
  const consulta = useQuery({
    queryKey: ["employees", "apdata", "contratados", true],
    queryFn: () => listarContratadosApdata(true),
  });

  const contratados = consulta.data?.data ?? [];

  const colaborador = contratados.find(
    (item) =>
      normalizarNome(item.CON_DssNome) ===
      normalizarNome(colaboradorNome),
  );

  const situacoes: ApdataSituacao[] = colaborador?.situacoes ?? [];

  const ordenadas = [...situacoes].sort((a, b) =>
    b.CST_DtdSituacaoInicio.localeCompare(a.CST_DtdSituacaoInicio),
  );

  if (consulta.isLoading) return <ListaSkeleton />;

  if (consulta.isError) {
    return (
      <EstadoErro
        mensagem={errorMessage(consulta.error)}
        aoTentarNovamente={() => consulta.refetch()}
      />
    );
  }

  if (!colaborador) {
    return (
      <EstadoVazio
        titulo="Colaborador não encontrado no APDATA."
        descricao="Não foi possível localizar este colaborador pelo nome."
      />
    );
  }

  if (ordenadas.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma situação encontrada."
        descricao="Não existem situações registradas para este colaborador no APDATA."
      />
    );
  }

  return (
    <section className="mb-6">
      <h3 className="mb-4 font-semibold">Histórico de situações APDATA</h3>

      <ol className="relative ml-2 space-y-4 border-l-2 border-border pl-5">
        {ordenadas.map((item, index) => (
          <li
            key={`${item.CST_CdiSituacao}-${item.CST_DtdSituacaoInicio}-${index}`}
            className="relative rounded-md border border-border bg-card p-4"
          >
            <span className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-primary bg-background" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">
                {item.situacao?.SIT_D1sSituacao ??
                  "Situação não identificada"}
              </strong>

              {!item.CST_DtdSituacaoFim && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  Atual
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Data de início:</strong>{" "}
                {formatarDataApdata(item.CST_DtdSituacaoInicio)}
              </p>

              <p>
                <strong className="text-foreground">Data de término:</strong>{" "}
                {formatarDataApdata(item.CST_DtdSituacaoFim)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}