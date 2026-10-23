import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/session";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { useSaveLeave } from "@/hooks/use-leaves";
import { employeeQuery } from "@/hooks/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listEmployees } from "@/services/employees";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { configQuery, type Afastamento } from "@/lib/dados";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoErro, EstadoVazio, Paginacao } from "@/components/padroes";
import { Loader2 } from "lucide-react";

const VAZIO = "__vazio__";

const dataCivil = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
const dataOpcional = z.union([z.literal(""), dataCivil]);
const schema = z.object({
  colaborador_id: z.string().uuid("Selecione o colaborador."),
  obra_id: z.string().uuid("Selecione a obra."),
  funcao_id: z.string().uuid("Selecione a função."),
  data_afastamento: dataCivil,
  tipo_beneficio_id: z.union([z.literal(""), z.string().uuid("Selecione um benefício válido.")]),
  situacao_afastamento_id: z.string().uuid("Selecione a situação."),
  data_fim_beneficio: dataOpcional,
  data_retorno_previsto: dataOpcional,
  data_retorno_efetivo: dataOpcional,
  causa_cid: z.string().max(500, "Use até 500 caracteres."),
  observacoes: z.string().max(10000, "Use até 10.000 caracteres."),
});
type Estado = z.infer<typeof schema>;

const ESTADO_INICIAL: Estado = {
  colaborador_id: "",
  obra_id: "",
  funcao_id: "",
  data_afastamento: "",
  tipo_beneficio_id: "",
  situacao_afastamento_id: "",
  data_fim_beneficio: "",
  data_retorno_previsto: "",
  data_retorno_efetivo: "",
  causa_cid: "",
  observacoes: "",
};

function estadoDe(afastamento?: Afastamento | null): Estado {
  if (!afastamento) return ESTADO_INICIAL;
  return {
    colaborador_id: afastamento.colaborador_id,
    obra_id: afastamento.obra_id ?? "",
    funcao_id: afastamento.funcao_id ?? "",
    data_afastamento: afastamento.data_afastamento ?? "",
    tipo_beneficio_id: afastamento.tipo_beneficio_id ?? "",
    situacao_afastamento_id: afastamento.situacao_afastamento_id,
    data_fim_beneficio: afastamento.data_fim_beneficio ?? "",
    data_retorno_previsto: afastamento.data_retorno_previsto ?? "",
    data_retorno_efetivo: afastamento.data_retorno_efetivo ?? "",
    causa_cid: afastamento.causa_cid ?? "",
    observacoes: afastamento.observacoes ?? "",
  };
}

export function AfastamentoForm({ afastamento }: { afastamento?: Afastamento | null }) {
  const editando = Boolean(afastamento);
  const navigate = useNavigate();
  const { can } = useAuth();
  const {
    watch,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<Estado>({
    resolver: zodResolver(schema),
    defaultValues: estadoDe(afastamento),
  });
  const form = watch();
  const erros = Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, value.message]),
  );

  const [buscaColab, setBuscaColab] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(buscaColab.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaColab]);

  const colaboradoresRes = useQuery({
    queryKey: ["employees", "select", buscaDebounced],
    queryFn: () =>
      listEmployees({
        search: buscaDebounced || undefined,
        page: 1,
        perPage: 20,
      }),
    enabled: !editando && can("employees.read") && buscaDebounced.length >= 2,
    placeholderData: (previousData) => previousData,
  });
  // const [buscaColab, setBuscaColab] = useState("");

  // const colaboradoresRes = useQuery({
  //   queryKey: ["employees", "select-all", buscaColab.trim()],
  //   queryFn: async () => {
  //     const tamanhoPagina = 100;
  //     const primeiraPagina = await listEmployees({
  //       search: buscaColab.trim() || undefined,
  //       page: 1,
  //       perPage: tamanhoPagina,
  //     });

  //     const totalPaginas = primeiraPagina.meta.totalPages;
  //     const paginasRestantes = await Promise.all(
  //       Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, i) =>
  //         listEmployees({
  //           search: buscaColab.trim() || undefined,
  //           page: i + 2,
  //           perPage: tamanhoPagina,
  //         }),
  //       ),
  //     );

  //     return {
  //       ...primeiraPagina,
  //       data: [...primeiraPagina.data, ...paginasRestantes.flatMap((pagina) => pagina.data)],
  //     };
  //   },
  //   enabled: !editando && can("employees.read"),
  // });

  const selecionadoRes = useQuery({
    ...employeeQuery(form.colaborador_id),
    enabled: !editando && Boolean(form.colaborador_id) && can("employees.read"),
  });

  const obrasRes = useQuery(configQuery("obras", !editando));
  const funcoesRes = useQuery(configQuery("funcoes", !editando));
  const beneficiosRes = useQuery(configQuery("tipos_beneficio", !editando));
  const situacoesRes = useQuery(configQuery("situacoes_afastamento", !editando));

  const colaboradores = colaboradoresRes.data?.data ?? [];
  const colaboradoresFiltrados =
    selecionadoRes.data && !colaboradores.some((item) => item.id === selecionadoRes.data?.id)
      ? [selecionadoRes.data, ...colaboradores]
      : colaboradores;
  const manterAtivoOuAtual = (idAtual: string) => (item: { id: string; ativo: boolean }) =>
    item.ativo || item.id === idAtual;
  const obras = (obrasRes.data ?? []).filter(manterAtivoOuAtual(afastamento?.obra_id ?? ""));
  const funcoes = (funcoesRes.data ?? []).filter(manterAtivoOuAtual(afastamento?.funcao_id ?? ""));
  const beneficios = (beneficiosRes.data ?? []).filter(
    manterAtivoOuAtual(afastamento?.tipo_beneficio_id ?? ""),
  );
  const situacoes = (situacoesRes.data ?? []).filter(
    manterAtivoOuAtual(afastamento?.situacao_afastamento_id ?? ""),
  );

  const carregandoListas =
    (!editando && colaboradoresRes.isLoading) ||
    obrasRes.isLoading ||
    funcoesRes.isLoading ||
    beneficiosRes.isLoading ||
    situacoesRes.isLoading;

  function definir(campo: keyof Estado, valor: string) {
    setValue(campo, valor, { shouldDirty: true });
    clearErrors(campo);
  }

  function aoEscolherColaborador(id: string) {
    const colab = colaboradoresFiltrados.find((c) => c.id === id);
    definir("colaborador_id", id);
    if (!form.obra_id) definir("obra_id", colab?.obra_id ?? "");
    if (!form.funcao_id) definir("funcao_id", colab?.funcao_id ?? "");
  }

  const salvar = useSaveLeave();
  const nomesApi: Record<string, keyof Estado> = {
    colaboradorId: "colaborador_id",
    obraId: "obra_id",
    funcaoId: "funcao_id",
    situacaoId: "situacao_afastamento_id",
    dataAfastamento: "data_afastamento",
    tipoBeneficioId: "tipo_beneficio_id",
    dataFimBeneficio: "data_fim_beneficio",
    dataRetornoPrevista: "data_retorno_previsto",
    dataRetornoEfetiva: "data_retorno_efetivo",
    causaCid: "causa_cid",
    observacoes: "observacoes",
  };
  function enviar(values: Estado) {
    if (salvar.isPending) return;
    const form = values;
    salvar.mutate(
      {
        ...(afastamento ? { id: afastamento.id } : {}),
        input: {
          colaboradorId: form.colaborador_id,
          obraId: form.obra_id,
          funcaoId: form.funcao_id,
          situacaoId: form.situacao_afastamento_id,
          tipoBeneficioId: form.tipo_beneficio_id || null,
          dataAfastamento: form.data_afastamento,
          dataFimBeneficio: form.data_fim_beneficio || null,
          dataRetornoPrevista: form.data_retorno_previsto || null,
          dataRetornoEfetiva: form.data_retorno_efetivo || null,
          causaCid: form.causa_cid.trim() || null,
          observacoes: form.observacoes.trim() || null,
        },
      },
      {
        onSuccess: (item) => {
          toast.success(editando ? "Afastamento atualizado." : "Afastamento cadastrado.");
          void navigate({ to: "/afastamentos/$id", params: { id: item.id } });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            error.fieldErrors.forEach(({ field, message }) => {
              const name = nomesApi[field];
              if (name) setError(name, { type: "server", message });
            });
          }
          toast.error(errorMessage(error));
        },
      },
    );
  }

  if (!can(editando ? "leaves.update" : "leaves.create"))
    return (
      <EstadoVazio
        titulo="Acesso negado"
        descricao="Você não possui permissão para salvar afastamentos."
      />
    );
  if (!editando && !can("employees.read"))
    return (
      <EstadoVazio
        titulo="Cadastro indisponível"
        descricao="É necessária permissão de consulta de colaboradores para criar um afastamento."
      />
    );
  const erroListas = [
    obrasRes,
    funcoesRes,
    beneficiosRes,
    situacoesRes,
    ...(!editando ? [colaboradoresRes] : []),
  ].find((query) => query.isError);
  if (erroListas)
    return (
      <EstadoErro
        mensagem={errorMessage(erroListas.error)}
        aoTentarNovamente={() => {
          void erroListas.refetch();
        }}
      />
    );

  if (carregandoListas) {
    return (
      <div className="max-w-4xl space-y-6" aria-busy="true" aria-label="Carregando formulário">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      noValidate
      className="max-w-4xl space-y-6"
      aria-busy={salvar.isPending}
    >
      {salvar.isError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {errorMessage(salvar.error)}
        </p>
      ) : null}
      <section className="rounded-md border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Identificação
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <Label htmlFor="colaborador">{rotuloComObrigatorio("Colaborador *")}</Label>
            <Input
              id="busca-colaborador"
              placeholder="Pesquisar por nome ou código"
              value={buscaColab}
              onChange={(e) => {
                setBuscaColab(e.target.value);
                // colabPag.setPagina(1);
              }}
              className="mt-1.5"
              disabled={editando}
            />
            <Select
              value={form.colaborador_id}
              onValueChange={aoEscolherColaborador}
              disabled={editando}
            >
              <SelectTrigger id="colaborador" className="mt-2">
                <SelectValue placeholder="Selecione o colaborador">
                  {editando
                    ? `${afastamento?.colaboradores?.codigo_interno} — ${afastamento?.colaboradores?.nome}`
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colaboradoresFiltrados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo_interno} — {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros["colaborador_id"] ? (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {erros["colaborador_id"]}
              </p>
            ) : null}
            {/* {!editando ? (
              <Paginacao
                {...colabPag}
                total={colaboradoresRes.data?.meta.total ?? 0}
                totalPaginas={colaboradoresRes.data?.meta.totalPages ?? 1}
              />
            ) : null} */}
          </div>

          <CampoSelect
            id="obra"
            rotulo="Obra *"
            valor={form.obra_id}
            aoMudar={(v) => definir("obra_id", v)}
            itens={obras}
            erro={erros["obra_id"]}
          />
          <CampoSelect
            id="funcao"
            rotulo="Função *"
            valor={form.funcao_id}
            aoMudar={(v) => definir("funcao_id", v)}
            itens={funcoes}
            erro={erros["funcao_id"]}
          />
          <CampoData
            id="data_afastamento"
            erro={erros["data_afastamento"]}
            rotulo="Data do afastamento *"
            valor={form.data_afastamento}
            aoMudar={(v) => definir("data_afastamento", v)}
          />
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Benefício e situação
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <CampoSelect
            id="beneficio"
            erro={erros["tipo_beneficio_id"]}
            rotulo="Tipo de benefício"
            valor={form.tipo_beneficio_id}
            aoMudar={(v) => definir("tipo_beneficio_id", v)}
            itens={beneficios.map((b) => ({
              id: b.id,
              nome: `${b.codigo ? b.codigo + " — " : ""}${b.nome}`,
            }))}
            permiteVazio
          />
          <CampoSelect
            id="situacao"
            rotulo="Situação *"
            valor={form.situacao_afastamento_id}
            aoMudar={(v) => definir("situacao_afastamento_id", v)}
            itens={situacoes}
            erro={erros["situacao_afastamento_id"]}
          />
          <CampoData
            id="fim"
            erro={erros["data_fim_beneficio"]}
            rotulo="Fim do benefício"
            valor={form.data_fim_beneficio}
            aoMudar={(v) => definir("data_fim_beneficio", v)}
          />
          <CampoData
            id="previsto"
            erro={erros["data_retorno_previsto"]}
            rotulo="Retorno previsto"
            valor={form.data_retorno_previsto}
            aoMudar={(v) => definir("data_retorno_previsto", v)}
          />
          <CampoData
            id="efetivo"
            erro={erros["data_retorno_efetivo"]}
            rotulo="Retorno efetivo"
            valor={form.data_retorno_efetivo}
            aoMudar={(v) => definir("data_retorno_efetivo", v)}
          />
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Detalhes
        </h2>
        <div className="mt-4 grid gap-4">
          <div>
            <Label htmlFor="cid">Causa / CID</Label>
            <Textarea
              id="cid"
              value={form.causa_cid}
              onChange={(e) => definir("causa_cid", e.target.value)}
              className="mt-1.5"
              rows={2}
              maxLength={500}
              aria-invalid={Boolean(erros["causa_cid"])}
            />
            {erros["causa_cid"] ? (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {erros["causa_cid"]}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => definir("observacoes", e.target.value)}
              className="mt-1.5"
              rows={4}
              maxLength={10000}
              aria-invalid={Boolean(erros["observacoes"])}
            />
            {erros["observacoes"] ? (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {erros["observacoes"]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void navigate(
              afastamento
                ? { to: "/afastamentos/$id", params: { id: afastamento.id } }
                : { to: "/" },
            )
          }
          disabled={salvar.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {salvar.isPending ? "Salvando…" : "Salvar afastamento"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Campos marcados com <span className="text-primary">*</span> são obrigatórios.
      </p>
    </form>
  );
}

function rotuloComObrigatorio(rotulo: string) {
  const obrigatorio = rotulo.endsWith(" *");
  const texto = obrigatorio ? rotulo.slice(0, -2) : rotulo;
  return (
    <>
      {texto}
      {obrigatorio ? (
        <>
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (obrigatório)</span>
        </>
      ) : null}
    </>
  );
}

function CampoData({
  id,
  rotulo,
  valor,
  aoMudar,
  erro,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  erro?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{rotuloComObrigatorio(rotulo)}</Label>
      <Input
        id={id}
        type="date"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1.5"
        required={rotulo.endsWith(" *")}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

function CampoSelect({
  id,
  rotulo,
  valor,
  aoMudar,
  itens,
  permiteVazio,
  erro,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  itens: Array<{ id: string; nome: string }>;
  permiteVazio?: boolean;
  erro?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{rotuloComObrigatorio(rotulo)}</Label>
      <Select
        value={valor || (permiteVazio ? VAZIO : "")}
        onValueChange={(v) => aoMudar(v === VAZIO ? "" : v)}
      >
        <SelectTrigger
          id={id}
          className="mt-1.5"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
        >
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {permiteVazio ? <SelectItem value={VAZIO}>Não informado</SelectItem> : null}
          {itens.map((i) => (
            <SelectItem key={i.id} value={i.id}>
              {i.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
