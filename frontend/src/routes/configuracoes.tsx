import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Power } from "lucide-react";
import {
  AcoesLinha,
  CABECALHO_FIXO,
  ConfirmDialog,
  EstadoErro,
  EstadoVazio,
  Paginacao,
  StatusBadge,
  TABELA_CONTAINER,
  TabelaSkeleton,
  mensagemAmigavel,
  type AcaoLinha,
} from "@/components/padroes";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/session";
import { catalogsPageQuery } from "@/hooks/use-catalogs";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { createCatalog, updateCatalog, type CatalogWrite } from "@/services/catalogs";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ROTULO_CLASSIFICACAO,
  type Classificacao,
  type ItemSimples,
  type TabelaConfig,
} from "@/lib/dados";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Controle de Afastamentos MCM" },
      {
        name: "description",
        content: "Cadastre obras, funções, tipos de benefício, situações, andamentos e documentos.",
      },
      { property: "og:title", content: "Configurações — Controle de Afastamentos MCM" },
      {
        property: "og:description",
        content: "Listas de apoio do sistema de controle de afastamentos.",
      },
    ],
  }),
  component: PaginaConfiguracoes,
});

const ABAS: Array<{ tabela: TabelaConfig; rotulo: string }> = [
  { tabela: "obras", rotulo: "Obras" },
  { tabela: "funcoes", rotulo: "Funções" },
  { tabela: "tipos_beneficio", rotulo: "Tipos de benefício" },
  { tabela: "situacoes_afastamento", rotulo: "Situações" },
  { tabela: "tipos_andamento_afastamento", rotulo: "Tipos de andamento" },
  { tabela: "tipos_documento_afastamento", rotulo: "Tipos de documento" },
];

function PaginaConfiguracoes() {
  const { can } = useAuth();
  if (!can("settings.manage"))
    return (
      <AppLayout titulo="Configurações">
        <EstadoErro mensagem="Você não tem permissão para administrar os cadastros auxiliares." />
      </AppLayout>
    );
  return (
    <AppLayout titulo="Configurações" descricao="Listas usadas nos cadastros do sistema.">
      <Tabs defaultValue="obras">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          {ABAS.map((a) => (
            <TabsTrigger key={a.tabela} value={a.tabela}>
              {a.rotulo}
            </TabsTrigger>
          ))}
        </TabsList>
        {ABAS.map((a) => (
          <TabsContent key={a.tabela} value={a.tabela}>
            <AbaConfig tabela={a.tabela} rotulo={a.rotulo} />
          </TabsContent>
        ))}
      </Tabs>
    </AppLayout>
  );
}

type Form = {
  nome: string;
  classificacao_sistema: Classificacao;
};

const FORM_VAZIO: Form = {
  nome: "",
  classificacao_sistema: "ATIVO",
};

function AbaConfig({ tabela, rotulo }: { tabela: TabelaConfig; rotulo: string }) {
  const queryClient = useQueryClient();
  const pagination = useServerPagination();
  const [busca, setBusca] = useState("");
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery(
    catalogsPageQuery(tabela, {
      page: pagination.pagina,
      perPage: pagination.tamanho,
      search: busca.trim() || undefined,
    }),
  );
  const itens = data?.data ?? [];
  const pag = {
    ...pagination,
    total: data?.meta.total ?? 0,
    totalPaginas: data?.meta.totalPages ?? 1,
  };
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ItemSimples | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [confirmar, setConfirmar] = useState<ItemSimples | null>(null);

  const temClassificacao = tabela === "situacoes_afastamento";

  function abrirNovo() {
    setEditando(null);
    salvar.reset();
    setForm(FORM_VAZIO);
    setAberto(true);
  }

  function abrirEdicao(item: ItemSimples) {
    salvar.reset();
    setEditando(item);
    setForm({
      nome: item.nome,
      classificacao_sistema: item.classificacao_sistema ?? "ATIVO",
    });
    setAberto(true);
  }

  function invalidar() {
    pagination.setPagina(1);
    queryClient.invalidateQueries({ queryKey: ["catalogs", tabela] });
    if (tabela === "obras" || tabela === "funcoes") {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    }
    if (["obras", "funcoes", "tipos_beneficio", "situacoes_afastamento"].includes(tabela)) {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["employees", "history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (tabela === "tipos_andamento_afastamento")
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    if (tabela === "tipos_documento_afastamento")
      queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload: CatalogWrite = { nome: form.nome.trim() };
      if (temClassificacao) payload.classificacao = form.classificacao_sistema;
      if (editando) return updateCatalog(tabela, editando.id, payload);
      return createCatalog(tabela, payload);
    },
    onSuccess: () => {
      invalidar();
      toast.success(editando ? "Registro atualizado." : "Registro cadastrado.");
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  const alternar = useMutation({
    mutationFn: async (item: ItemSimples) => {
      return updateCatalog(tabela, item.id, { ativo: !item.ativo });
    },
    onSuccess: () => {
      invalidar();
      toast.success("Situação do registro atualizada.");
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  const acoesDe = (item: ItemSimples): AcaoLinha[] => [
    { rotulo: "Editar", icone: Pencil, aoClicar: () => abrirEdicao(item) },
    {
      rotulo: item.ativo ? "Inativar" : "Reativar",
      icone: Power,
      destrutiva: item.ativo,
      aoClicar: () => setConfirmar(item),
    },
  ];

  return (
    <div className="mt-4 rounded-md border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">{rotulo}</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Carregando…"
              : `${pag.total} ${pag.total === 1 ? "registro" : "registros"}`}
          </p>
        </div>
        <Button onClick={abrirNovo} className="shrink-0">
          <Plus className="size-4" /> Novo registro
        </Button>
      </div>

      <div className="p-4">
        <Label htmlFor={`busca-${tabela}`} className="sr-only">
          Buscar em {rotulo}
        </Label>
        <Input
          id={`busca-${tabela}`}
          placeholder="Buscar por nome"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            pagination.setPagina(1);
          }}
        />
      </div>
      {isFetching && !isLoading ? (
        <p role="status" className="px-4 text-sm text-muted-foreground">
          Atualizando…
        </p>
      ) : null}
      {isLoading ? (
        <TabelaSkeleton linhas={4} />
      ) : isError ? (
        <EstadoErro
          className="m-4"
          mensagem={mensagemAmigavel(error)}
          aoTentarNovamente={() => refetch()}
        />
      ) : itens.length === 0 ? (
        <EstadoVazio
          className="m-4"
          titulo={`Nenhum registro em ${rotulo}.`}
          descricao={
            busca
              ? "Ajuste a busca para ver mais resultados."
              : "Cadastre o primeiro item para usá-lo nas listas de seleção."
          }
          acao={
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="size-4" /> Novo registro
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-border md:hidden">
            {itens.map((item) => (
              <li key={item.id} className="flex items-start gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.nome}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge ativo={item.ativo} />
                    {temClassificacao && item.classificacao_sistema ? (
                      <span>{ROTULO_CLASSIFICACAO[item.classificacao_sistema]}</span>
                    ) : null}
                  </div>
                </div>
                <AcoesLinha acoes={acoesDe(item)} compacto />
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table containerClassName={TABELA_CONTAINER}>
              <TableHeader className={CABECALHO_FIXO}>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {temClassificacao ? <TableHead>Classificação</TableHead> : null}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    {temClassificacao ? (
                      <TableCell>
                        {item.classificacao_sistema
                          ? ROTULO_CLASSIFICACAO[item.classificacao_sistema]
                          : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <StatusBadge ativo={item.ativo} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AcoesLinha acoes={acoesDe(item)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Paginacao {...pag} />
        </>
      )}

      <Dialog
        open={aberto}
        onOpenChange={(value) => {
          if (!salvar.isPending) setAberto(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar" : "Novo"} — {rotulo}
            </DialogTitle>
          </DialogHeader>
          {salvar.isError ? <EstadoErro mensagem={mensagemAmigavel(salvar.error)} /> : null}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="config-nome">Nome *</Label>
              <Input
                id="config-nome"
                value={form.nome}
                maxLength={200}
                aria-required="true"
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1.5"
              />
            </div>
            {temClassificacao ? (
              <div>
                <Label htmlFor="config-classificacao">Classificação</Label>
                <Select
                  value={form.classificacao_sistema}
                  onValueChange={(v) =>
                    setForm({ ...form, classificacao_sistema: v as Classificacao })
                  }
                >
                  <SelectTrigger id="config-classificacao" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                    <SelectItem value="APOSENTADO">Aposentado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAberto(false)} disabled={salvar.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (form.nome.trim().length < 2) {
                  toast.error("Informe um nome com pelo menos 2 caracteres.");
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
        aoMudar={(v) => !v && setConfirmar(null)}
        titulo={confirmar?.ativo ? "Inativar registro?" : "Reativar registro?"}
        descricao={
          confirmar?.ativo
            ? `"${confirmar.nome}" deixará de aparecer nas listas de seleção. Registros já vinculados não são alterados e é possível reativar depois.`
            : `"${confirmar?.nome ?? ""}" voltará a aparecer nas listas de seleção.`
        }
        rotuloConfirmar={confirmar?.ativo ? "Inativar" : "Reativar"}
        destrutivo={!!confirmar?.ativo}
        carregando={alternar.isPending}
        aoConfirmar={() =>
          confirmar && alternar.mutate(confirmar, { onSuccess: () => setConfirmar(null) })
        }
      />
    </div>
  );
}
