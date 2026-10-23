import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { History, Loader2, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/session";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { employeesPageQuery, employeeHistoryQuery } from "@/hooks/use-employees";
import { configQuery } from "@/hooks/use-catalogs";
import {
  createEmployee,
  updateEmployee,
  setEmployeeActive,
  listarContratadosApdata,
  sincronizarContratadosApdata,
} from "@/services/employees";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ConfirmDialog,
  EstadoErro,
  EstadoVazio,
  FiltroSelect,
  Paginacao,
  StatusBadge,
  TABELA_CONTAINER,
  TabelaSkeleton,
  TODOS,
  mensagemAmigavel,
  type AcaoLinha,
} from "@/components/padroes";
import { formatarData, type Colaborador } from "@/lib/dados";

export const Route = createFileRoute("/colaboradores")({
  head: () => ({
    meta: [
      { title: "Colaboradores — Controle de Afastamentos MCM" },
      {
        name: "description",
        content: "Cadastro de colaboradores com obra, função, contato e situação de atividade.",
      },
      { property: "og:title", content: "Colaboradores — Controle de Afastamentos MCM" },
      {
        property: "og:description",
        content: "Lista de colaboradores ativos e inativos por obra e função.",
      },
    ],
  }),
  component: PaginaColaboradores,
});

const VAZIO = "__vazio__";

type Form = {
  nome: string;
  contato: string;
  codigo: string;
  obra_id: string;
  funcao_id: string;
};

const FORM_VAZIO: Form = {
  nome: "",
  contato: "",
  codigo: "",
  obra_id: "",
  funcao_id: "",
};

function textoApdata(valor: unknown): string {
  if (typeof valor === "string" || typeof valor === "number") {
    return String(valor);
  }

  if (valor && typeof valor === "object") {
    if ("CAR_D1sCargo" in valor) {
      return textoApdata(valor.CAR_D1sCargo);
    }

    if ("SIT_D1sSituacao" in valor) {
      return textoApdata(valor.SIT_D1sSituacao);
    }

    if ("CCU_D1sCentroCusto" in valor) {
      return textoApdata(valor.CCU_D1sCentroCusto);
    }

    if ("FOL_D1sFolha" in valor) {
      return textoApdata(valor.FOL_D1sFolha);
    }
  }

  return "—";
}

function PaginaColaboradores() {
  const queryClient = useQueryClient();

  const { can } = useAuth();
  const pagination = useServerPagination();
  const obrasQuery = useQuery({ ...configQuery("obras", false), enabled: can("settings.manage") });
  const funcoesQuery = useQuery({
    ...configQuery("funcoes", false),
    enabled: can("settings.manage"),
  });
  const obras = obrasQuery.data ?? [];
  const sincronizarApdata = useMutation({
    mutationFn: sincronizarContratadosApdata,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["leaves"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await obrasQuery.refetch();
      await funcoesQuery.refetch();

      toast.success("Sincronização do APDATA concluída.");
    },
    onError: (erro: Error) => {
      toast.error(mensagemAmigavel(erro, "Não foi possível sincronizar o APDATA."));
    },
  });
  const funcoes = funcoesQuery.data ?? [];

  const [busca, setBusca] = useState("");
  const [obraId, setObraId] = useState(TODOS);
  const [status, setStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [historico, setHistorico] = useState<Colaborador | null>(null);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [confirmar, setConfirmar] = useState<Colaborador | null>(null);
  const apdataQuery = useQuery({
    queryKey: ["employees", "apdata", "contratados", true],
    queryFn: () => listarContratadosApdata(true),
    enabled: can("employees.read"),
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    ...employeesPageQuery({
      page: pagination.pagina,
      perPage: pagination.tamanho,
      search: busca.trim() || undefined,
      obraId: obraId === TODOS ? undefined : obraId,
      ativo: status === "todos" ? undefined : status === "ativos",
    }),
    enabled: can("employees.read"),
  });
  const lista = data?.data ?? [];
  const pag = {
    ...pagination,
    total: data?.meta.total ?? 0,
    totalPaginas: data?.meta.totalPages ?? 1,
  };
  const filtrado = Boolean(busca.trim()) || obraId !== TODOS || status !== "todos";
  const obrasAtivas = obras.filter((item) => item.ativo);
  const funcoesAtivas = funcoes.filter((item) => item.ativo);
  const obrasForm =
    editando?.obra_id && !obrasAtivas.some((o) => o.id === editando.obra_id)
      ? [{ id: editando.obra_id, nome: editando.obras?.nome ?? "Obra atual" }, ...obrasAtivas]
      : obrasAtivas;
  const funcoesForm =
    editando?.funcao_id && !funcoesAtivas.some((f) => f.id === editando.funcao_id)
      ? [
          { id: editando.funcao_id, nome: editando.funcoes?.nome ?? "Função atual" },
          ...funcoesAtivas,
        ]
      : funcoesAtivas;

  function abrirNovo() {
    setEditando(null);
    salvar.reset();
    setForm(FORM_VAZIO);
    setAberto(true);
  }

  function abrirEdicao(c: Colaborador) {
    salvar.reset();
    setEditando(c);
    setForm({
      nome: c.nome,
      contato: c.contato ?? "",
      codigo: c.codigo_interno,
      obra_id: c.obra_id ?? "",
      funcao_id: c.funcao_id ?? "",
    });
    setAberto(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome.trim(), obraId: form.obra_id, funcaoId: form.funcao_id };
      if (editando)
        return updateEmployee(editando.id, { ...payload, contato: form.contato.trim() || null });
      return createEmployee({
        ...payload,
        codigoCorporativo: form.codigo.trim(),
        ...(form.contato.trim() ? { contato: form.contato.trim() } : {}),
      });
    },
    onSuccess: () => {
      pagination.setPagina(1);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(editando ? "Colaborador atualizado." : "Colaborador cadastrado.");
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  const alternarAtivo = useMutation({
    mutationFn: async (c: Colaborador) => {
      return setEmployeeActive(c.id, !c.ativo);
    },
    onSuccess: () => {
      pagination.setPagina(1);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Situação do colaborador atualizada.");
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  const acoesDe = (c: Colaborador): AcaoLinha[] => [
    ...(can("leaves.read")
      ? [{ rotulo: "Histórico", icone: History, aoClicar: () => setHistorico(c) }]
      : []),
    ...(can("employees.manage")
      ? [
          { rotulo: "Editar", icone: Pencil, aoClicar: () => abrirEdicao(c) },
          {
            rotulo: c.ativo ? "Inativar" : "Reativar",
            icone: Power,
            destrutiva: c.ativo,
            aoClicar: () => setConfirmar(c),
          },
        ]
      : []),
  ];

  if (!can("employees.read"))
    return (
      <AppLayout titulo="Colaboradores">
        <EstadoErro mensagem="Você não tem permissão para consultar os colaboradores." />
      </AppLayout>
    );

  return (
    <AppLayout
      titulo="Colaboradores"
      descricao="Cadastro de colaboradores da empresa."

      acoes={
        can("employees.manage") ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => sincronizarApdata.mutate()}
              disabled={sincronizarApdata.isPending}
            >
              {sincronizarApdata.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {sincronizarApdata.isPending ? "Sincronizando APDATA..." : "Sincronizar APDATA"}
            </Button>

            <Button onClick={abrirNovo}>
              <Plus className="size-4" /> Novo colaborador
            </Button>
          </div>
        ) : null
      }
    >
      <BarraFiltros
        busca={busca}
        aoBuscar={(value) => {
          setBusca(value);
          pagination.setPagina(1);
        }}
        placeholderBusca="Nome ou código"
        filtrosAtivos={(obraId !== TODOS ? 1 : 0) + (status !== "todos" ? 1 : 0)}
        aoLimpar={() => {
          pagination.setPagina(1);
          setBusca("");
          setObraId(TODOS);
          setStatus("todos");
        }}
        colunas="lg:grid-cols-2"
      >
        <FiltroSelect
          id="c-obra"
          rotulo="Obra"
          valor={obraId}
          aoMudar={(value) => {
            setObraId(value);
            pagination.setPagina(1);
          }}
          itens={obras}
        />
        <FiltroSelect
          id="c-status"
          rotulo="Status"
          valor={status}
          aoMudar={(v) => {
            setStatus(v as typeof status);
            pagination.setPagina(1);
          }}
          itens={[
            { id: "ativos", nome: "Ativos" },
            { id: "inativos", nome: "Inativos" },
          ]}
          rotuloTodos="Todos"
        />
      </BarraFiltros>

      {obrasQuery.isError ? (
        <EstadoErro
          className="mt-4"
          mensagem={mensagemAmigavel(obrasQuery.error)}
          aoTentarNovamente={() => obrasQuery.refetch()}
        />
      ) : null}
      {isFetching && !isLoading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Atualizando…
        </p>
      ) : null}
      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
        {isLoading ? (
          <TabelaSkeleton />
        ) : isError ? (
          <EstadoErro
            className="m-4"
            mensagem={mensagemAmigavel(error, "Não foi possível carregar os colaboradores.")}
            aoTentarNovamente={() => refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="m-4"
            titulo="Nenhum colaborador encontrado."
            descricao={
              filtrado
                ? "Ajuste ou limpe os filtros para ver mais resultados."
                : "Cadastre o primeiro colaborador para registrar afastamentos."
            }
            acao={
              filtrado || !can("employees.manage") ? undefined : (
                <Button size="sm" onClick={abrirNovo}>
                  <Plus className="size-4" /> Novo colaborador
                </Button>
              )
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {lista.map((c) => (
                <li key={c.id} className="flex items-start gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{c.codigo_interno}</span> · {c.obras?.nome ?? "—"}{" "}
                      · {c.funcoes?.nome ?? "—"}
                    </p>
                    <div className="mt-2">
                      <StatusBadge ativo={c.ativo} />
                    </div>
                  </div>
                  <AcoesLinha acoes={acoesDe(c)} compacto />
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <Table containerClassName={TABELA_CONTAINER}>
                <TableHeader className={CABECALHO_FIXO}>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden lg:table-cell">Contato</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead className="hidden lg:table-cell">Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.codigo_interno}</TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium">{c.nome}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.contato ?? "—"}</TableCell>
                      <TableCell>{c.obras?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {c.funcoes?.nome ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge ativo={c.ativo} />
                      </TableCell>
                      <TableCell className="text-right">
                        <AcoesLinha acoes={acoesDe(c)} />
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

      {/* <section className="mt-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Contratados da APDATA</h2>
          <p className="text-sm text-muted-foreground">
            Colaboradores recebidos da integração externa. Consulta somente leitura.
          </p>
        </div>

        {apdataQuery.isPending ? (
          <div className="rounded-md border border-border bg-card p-4">
            <TabelaSkeleton />
          </div>
        ) : apdataQuery.isError ? (
          <EstadoErro
            mensagem={mensagemAmigavel(
              apdataQuery.error,
              "Não foi possível carregar os contratados da APDATA.",
            )}
            aoTentarNovamente={() => void apdataQuery.refetch()}
          />
        ) : apdataQuery.data.data.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum contratado encontrado na APDATA."
            descricao="Não há contratados ativos para exibir."
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <Table containerClassName={TABELA_CONTAINER}>
              <TableHeader className={CABECALHO_FIXO}>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula / Código</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {apdataQuery.data.data.map((item, index) => {
                  const nome = textoApdata(item["CON_DssNome"]);

                  const codigo = textoApdata(item["CON_CdiContratado"]);

                  const cargo = textoApdata(item["cargo"]);

                  const situacao = textoApdata(item["situacao"]);

                  return (
                    <TableRow key={`${codigo}-${index}`}>
                      <TableCell className="max-w-[280px] truncate font-medium">{nome}</TableCell>

                      <TableCell className="font-mono text-xs">{codigo}</TableCell>

                      <TableCell>{cargo}</TableCell>

                      <TableCell>{situacao}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section> */}

      <Dialog
        open={aberto}
        onOpenChange={(value) => {
          if (!salvar.isPending) setAberto(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
          </DialogHeader>
          {salvar.isError ? <EstadoErro mensagem={mensagemAmigavel(salvar.error)} /> : null}
          {!can("settings.manage") ? (
            <p role="alert" className="text-sm text-destructive">
              Você não tem acesso aos cadastros de obras e funções. Solicite acesso para selecionar
              novos vínculos.
            </p>
          ) : obrasQuery.isError || funcoesQuery.isError ? (
            <EstadoErro
              mensagem={mensagemAmigavel(obrasQuery.error ?? funcoesQuery.error)}
              aoTentarNovamente={() => {
                obrasQuery.refetch();
                funcoesQuery.refetch();
              }}
            />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="codigo-corporativo">Código corporativo *</Label>
              <Input
                id="codigo-corporativo"
                className="mt-1.5"
                value={form.codigo}
                maxLength={100}
                aria-required="true"
                disabled={Boolean(editando)}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                maxLength={200}
                aria-required="true"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                maxLength={255}
                value={form.contato}
                onChange={(e) => setForm({ ...form, contato: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="obra">Obra *</Label>
              <Select
                value={form.obra_id || VAZIO}
                onValueChange={(v) => setForm({ ...form, obra_id: v === VAZIO ? "" : v })}
              >
                <SelectTrigger id="obra" className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VAZIO} disabled>
                    Selecione
                  </SelectItem>
                  {obrasForm.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="funcao">Função *</Label>
              <Select
                value={form.funcao_id || VAZIO}
                onValueChange={(v) => setForm({ ...form, funcao_id: v === VAZIO ? "" : v })}
              >
                <SelectTrigger id="funcao" className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VAZIO} disabled>
                    Selecione
                  </SelectItem>
                  {funcoesForm.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAberto(false)} disabled={salvar.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (
                  form.nome.trim().length < 2 ||
                  !form.codigo.trim() ||
                  !form.obra_id ||
                  !form.funcao_id
                ) {
                  toast.error(
                    "Informe código corporativo, nome (mínimo 2 caracteres), obra e função.",
                  );
                  return;
                }
                salvar.mutate();
              }}
              disabled={salvar.isPending}
            >
              {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={!!confirmar}
        aoMudar={(v) => {
          if (!v && !alternarAtivo.isPending) setConfirmar(null);
        }}
        titulo={confirmar?.ativo ? "Inativar colaborador?" : "Reativar colaborador?"}
        descricao={
          confirmar?.ativo
            ? `${confirmar.nome} deixará de aparecer nas listas de seleção para novos afastamentos. O histórico é preservado e é possível reativar depois.`
            : `${confirmar?.nome ?? ""} voltará a aparecer nas listas de seleção.`
        }
        rotuloConfirmar={confirmar?.ativo ? "Inativar" : "Reativar"}
        destrutivo={!!confirmar?.ativo}
        carregando={alternarAtivo.isPending}
        aoConfirmar={() =>
          confirmar && alternarAtivo.mutate(confirmar, { onSuccess: () => setConfirmar(null) })
        }
      />
      {historico ? (
        <HistoricoColaborador colaborador={historico} aoFechar={() => setHistorico(null)} />
      ) : null}
    </AppLayout>
  );
}

function HistoricoColaborador({
  colaborador,
  aoFechar,
}: {
  colaborador: Colaborador;
  aoFechar: () => void;
}) {
  const pagination = useServerPagination();
  const query = useQuery(
    employeeHistoryQuery(colaborador.id, { page: pagination.pagina, perPage: pagination.tamanho }),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) aoFechar();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico — {colaborador.nome}</DialogTitle>
        </DialogHeader>
        {query.isLoading ? (
          <TabelaSkeleton />
        ) : query.isError ? (
          <EstadoErro
            mensagem={mensagemAmigavel(query.error)}
            aoTentarNovamente={() => query.refetch()}
          />
        ) : !query.data?.data.length ? (
          <EstadoVazio titulo="Nenhum afastamento registrado." />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {query.data.data.map((item) => (
                <li key={item.id} className="space-y-2 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        Afastamento em {formatarData(item.dataAfastamento)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.obra.nome} · {item.funcao.nome}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/afastamentos/$id" params={{ id: item.id }}>
                        Ver detalhe
                      </Link>
                    </Button>
                  </div>
                  <p className="text-sm">
                    {item.situacao.nome} · {item.tipoBeneficio?.nome ?? "Sem benefício informado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Retorno previsto: {formatarData(item.dataRetornoPrevista)} · Efetivo:{" "}
                    {formatarData(item.dataRetornoEfetiva)}
                  </p>
                </li>
              ))}
            </ul>
            <Paginacao
              {...pagination}
              total={query.data.meta.total}
              totalPaginas={query.data.meta.totalPages}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
