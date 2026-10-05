import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
  usePaginacao,
  type AcaoLinha,
} from "@/components/padroes";
import {
  colaboradoresQuery,
  configQuery,
  contagemAfastamentosQuery,
  type Colaborador,
} from "@/lib/dados";

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
  data_nascimento: string;
  data_admissao: string;
  obra_id: string;
  funcao_id: string;
};

const FORM_VAZIO: Form = {
  nome: "",
  contato: "",
  data_nascimento: "",
  data_admissao: "",
  obra_id: "",
  funcao_id: "",
};

function PaginaColaboradores() {
  const queryClient = useQueryClient();
  const {
    data: colaboradores = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(colaboradoresQuery(false));
  const { data: obras = [] } = useQuery(configQuery("obras"));
  const { data: funcoes = [] } = useQuery(configQuery("funcoes"));
  const { data: vinculos = {} } = useQuery(contagemAfastamentosQuery());

  const [busca, setBusca] = useState("");
  const [obraId, setObraId] = useState(TODOS);
  const [status, setStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [confirmar, setConfirmar] = useState<Colaborador | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return colaboradores.filter((c) => {
      if (termo && !c.nome.toLowerCase().includes(termo) && !c.codigo_interno.toLowerCase().includes(termo))
        return false;
      if (obraId !== TODOS && c.obra_id !== obraId) return false;
      if (status === "ativos" && !c.ativo) return false;
      if (status === "inativos" && c.ativo) return false;
      return true;
    });
  }, [colaboradores, busca, obraId, status]);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setAberto(true);
  }

  function abrirEdicao(c: Colaborador) {
    setEditando(c);
    setForm({
      nome: c.nome,
      contato: c.contato ?? "",
      data_nascimento: c.data_nascimento ?? "",
      data_admissao: c.data_admissao ?? "",
      obra_id: c.obra_id ?? "",
      funcao_id: c.funcao_id ?? "",
    });
    setAberto(true);
  }

  function proximoCodigo() {
    const numeros = colaboradores
      .map((c) => Number(c.codigo_interno.replace(/\D/g, "")))
      .filter((n) => Number.isFinite(n));
    const proximo = (numeros.length ? Math.max(...numeros) : 0) + 1;
    return `COL-${String(proximo).padStart(4, "0")}`;
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        contato: form.contato.trim() || null,
        data_nascimento: form.data_nascimento || null,
        data_admissao: form.data_admissao || null,
        obra_id: form.obra_id || null,
        funcao_id: form.funcao_id || null,
      };
      if (editando) {
        const { error } = await supabase
          .from("colaboradores")
          .update(payload)
          .eq("id", editando.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("colaboradores")
        .insert({ ...payload, codigo_interno: proximoCodigo(), ativo: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(editando ? "Colaborador atualizado." : "Colaborador cadastrado.");
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  const alternarAtivo = useMutation({
    mutationFn: async (c: Colaborador) => {
      const { error } = await supabase
        .from("colaboradores")
        .update({ ativo: !c.ativo })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Situação do colaborador atualizada.");
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  const pag = usePaginacao(lista);

  const acoesDe = (c: Colaborador): AcaoLinha[] => [
    { rotulo: "Editar", icone: Pencil, aoClicar: () => abrirEdicao(c) },
    {
      rotulo: c.ativo ? "Inativar" : "Reativar",
      icone: Power,
      destrutiva: c.ativo,
      aoClicar: () => setConfirmar(c),
      titulo: (vinculos as Record<string, number>)[c.id]
        ? "Colaborador com afastamentos: só pode ser inativado."
        : undefined,
    },
  ];


  return (
    <AppLayout
      titulo="Colaboradores"
      descricao="Cadastro de colaboradores da empresa."
      acoes={
        <Button onClick={abrirNovo}>
          <Plus className="size-4" /> Novo colaborador
        </Button>
      }
    >
      <BarraFiltros
        busca={busca}
        aoBuscar={setBusca}
        placeholderBusca="Nome ou código"
        filtrosAtivos={(obraId !== TODOS ? 1 : 0) + (status !== "todos" ? 1 : 0)}
        aoLimpar={() => {
          setBusca("");
          setObraId(TODOS);
          setStatus("todos");
        }}
        colunas="lg:grid-cols-2"
      >
        <FiltroSelect id="c-obra" rotulo="Obra" valor={obraId} aoMudar={setObraId} itens={obras} />
        <FiltroSelect
          id="c-status"
          rotulo="Status"
          valor={status}
          aoMudar={(v) => setStatus(v as typeof status)}
          itens={[
            { id: "ativos", nome: "Ativos" },
            { id: "inativos", nome: "Inativos" },
          ]}
          rotuloTodos="Todos"
        />
      </BarraFiltros>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
        {isLoading ? (
          <TabelaSkeleton />
        ) : isError ? (
          <EstadoErro
            className="m-4"
            mensagem="Não foi possível carregar os colaboradores."
            aoTentarNovamente={() => refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="m-4"
            titulo="Nenhum colaborador encontrado."
            descricao={
              colaboradores.length
                ? "Ajuste ou limpe os filtros para ver mais resultados."
                : "Cadastre o primeiro colaborador para registrar afastamentos."
            }
            acao={
              colaboradores.length ? undefined : (
                <Button size="sm" onClick={abrirNovo}>
                  <Plus className="size-4" /> Novo colaborador
                </Button>
              )
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {pag.visiveis.map((c) => (
                <li key={c.id} className="flex items-start gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{c.codigo_interno}</span> · {c.obras?.nome ?? "—"} ·{" "}
                      {c.funcoes?.nome ?? "—"}
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
                  {pag.visiveis.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.codigo_interno}</TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium">{c.nome}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.contato ?? "—"}</TableCell>
                      <TableCell>{c.obras?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{c.funcoes?.nome ?? "—"}</TableCell>
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

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                value={form.contato}
                onChange={(e) => setForm({ ...form, contato: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="nascimento">Data de nascimento</Label>
              <Input
                id="nascimento"
                type="date"
                value={form.data_nascimento}
                onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="admissao">Data de admissão</Label>
              <Input
                id="admissao"
                type="date"
                value={form.data_admissao}
                onChange={(e) => setForm({ ...form, data_admissao: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select
                value={form.obra_id || VAZIO}
                onValueChange={(v) => setForm({ ...form, obra_id: v === VAZIO ? "" : v })}
              >
                <SelectTrigger id="obra" className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VAZIO}>Não informado</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="funcao">Função</Label>
              <Select
                value={form.funcao_id || VAZIO}
                onValueChange={(v) => setForm({ ...form, funcao_id: v === VAZIO ? "" : v })}
              >
                <SelectTrigger id="funcao" className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VAZIO}>Não informado</SelectItem>
                  {funcoes.map((f) => (
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
                if (!form.nome.trim()) {
                  toast.error("Informe o nome do colaborador.");
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
          confirmar &&
          alternarAtivo.mutate(confirmar, { onSettled: () => setConfirmar(null) })
        }
      />
    </AppLayout>
  );
}
