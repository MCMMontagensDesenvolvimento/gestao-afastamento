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
  usePaginacao,
  type AcaoLinha,
} from "@/components/padroes";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
  configQuery,
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
        content:
          "Cadastre obras, funções, tipos de benefício, situações, andamentos e documentos.",
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
  codigo: string;
  ordem_exibicao: string;
  classificacao_sistema: Classificacao;
};

const FORM_VAZIO: Form = {
  nome: "",
  codigo: "",
  ordem_exibicao: "",
  classificacao_sistema: "ATIVO",
};

function AbaConfig({ tabela, rotulo }: { tabela: TabelaConfig; rotulo: string }) {
  const queryClient = useQueryClient();
  const { data: itens = [], isLoading, isError, refetch } = useQuery(configQuery(tabela, false));
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ItemSimples | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [confirmar, setConfirmar] = useState<ItemSimples | null>(null);
  const pag = usePaginacao(itens);

  const temCodigo = tabela === "tipos_beneficio";
  const temClassificacao = tabela === "situacoes_afastamento";
  const temOrdem = tabela !== "obras" && tabela !== "funcoes";

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setAberto(true);
  }

  function abrirEdicao(item: ItemSimples) {
    setEditando(item);
    setForm({
      nome: item.nome,
      codigo: item.codigo ?? "",
      ordem_exibicao: item.ordem_exibicao != null ? String(item.ordem_exibicao) : "",
      classificacao_sistema: item.classificacao_sistema ?? "ATIVO",
    });
    setAberto(true);
  }

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["config", tabela] });
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { nome: form.nome.trim() };
      if (temCodigo) payload["codigo"] = form.codigo.trim() || null;
      if (temClassificacao) payload["classificacao_sistema"] = form.classificacao_sistema;
      if (temOrdem) payload["ordem_exibicao"] = Number(form.ordem_exibicao) || 0;

      if (editando) {
        const { error } = await supabase
          .from(tabela)
          .update(payload as never)
          .eq("id", editando.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from(tabela).insert({ ...payload, ativo: true } as never);
      if (error) throw error;
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
      const { error } = await supabase
        .from(tabela)
        .update({ ativo: !item.ativo } as never)
        .eq("id", item.id);
      if (error) throw error;
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
            {isLoading ? "Carregando…" : `${itens.length} ${itens.length === 1 ? "registro" : "registros"}`}
          </p>
        </div>
        <Button onClick={abrirNovo} className="shrink-0">
          <Plus className="size-4" /> Novo registro
        </Button>
      </div>

      {isLoading ? (
        <TabelaSkeleton linhas={4} />
      ) : isError ? (
        <EstadoErro className="m-4" aoTentarNovamente={() => refetch()} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          className="m-4"
          titulo={`Nenhum registro em ${rotulo}.`}
          descricao="Cadastre o primeiro item para usá-lo nas listas de seleção."
          acao={
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="size-4" /> Novo registro
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-border md:hidden">
            {pag.visiveis.map((item) => (
              <li key={item.id} className="flex items-start gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {temCodigo && item.codigo ? `${item.codigo} — ` : ""}
                    {item.nome}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge ativo={item.ativo} />
                    {temClassificacao && item.classificacao_sistema ? (
                      <span>{ROTULO_CLASSIFICACAO[item.classificacao_sistema]}</span>
                    ) : null}
                    {temOrdem ? <span>Ordem {item.ordem_exibicao ?? "—"}</span> : null}
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
                  {temCodigo ? <TableHead>Código</TableHead> : null}
                  <TableHead>Nome</TableHead>
                  {temClassificacao ? <TableHead>Classificação</TableHead> : null}
                  {temOrdem ? <TableHead>Ordem</TableHead> : null}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pag.visiveis.map((item) => (
                  <TableRow key={item.id}>
                    {temCodigo ? (
                      <TableCell className="font-mono text-xs">{item.codigo ?? "—"}</TableCell>
                    ) : null}
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    {temClassificacao ? (
                      <TableCell>
                        {item.classificacao_sistema
                          ? ROTULO_CLASSIFICACAO[item.classificacao_sistema]
                          : "—"}
                      </TableCell>
                    ) : null}
                    {temOrdem ? (
                      <TableCell className="tabular-nums">{item.ordem_exibicao ?? "—"}</TableCell>
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

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar" : "Novo"} — {rotulo}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="config-nome">Nome *</Label>
              <Input
                id="config-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1.5"
              />
            </div>
            {temCodigo ? (
              <div>
                <Label htmlFor="config-codigo">Código</Label>
                <Input
                  id="config-codigo"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            ) : null}
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
            {temOrdem ? (
              <div>
                <Label htmlFor="config-ordem">Ordem de exibição</Label>
                <Input
                  id="config-ordem"
                  type="number"
                  value={form.ordem_exibicao}
                  onChange={(e) => setForm({ ...form, ordem_exibicao: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAberto(false)} disabled={salvar.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!form.nome.trim()) {
                  toast.error("Informe o nome.");
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
          confirmar && alternar.mutate(confirmar, { onSettled: () => setConfirmar(null) })
        }
      />
    </div>
  );
}
