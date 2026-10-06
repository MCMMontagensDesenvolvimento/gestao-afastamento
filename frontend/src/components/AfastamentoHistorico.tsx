import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/session";
import { errorMessage } from "@/lib/api/errors";
import { andamentosQuery, useProgressMutations } from "@/hooks/use-progress";
import { configQuery, formatarData, type Andamento } from "@/lib/dados";
import {
  AcoesLinha,
  CampoForm,
  ConfirmDialog,
  EstadoErro,
  EstadoVazio,
  ListaSkeleton,
} from "@/components/padroes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Form = {
  data_andamento: string;
  tipo_andamento_id: string;
  descricao: string;
  proxima_acao: string;
  data_proxima_acao: string;
};
const vazio: Form = {
  data_andamento: "",
  tipo_andamento_id: "",
  descricao: "",
  proxima_acao: "",
  data_proxima_acao: "",
};

export function AfastamentoHistorico({ afastamentoId }: { afastamentoId: string }) {
  const { can } = useAuth();
  const { save: salvar, remove } = useProgressMutations(afastamentoId);
  const [erroForm, setErroForm] = useState("");
  const {
    data: andamentos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ ...andamentosQuery(afastamentoId), enabled: can("progress.read") });
  const tiposRes = useQuery({
    ...configQuery("tipos_andamento_afastamento", false),
    enabled: can("progress.manage"),
  });
  const tipos = tiposRes.data ?? [];
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Andamento | null>(null);
  const [form, setForm] = useState<Form>(vazio);

  function abrir(item?: Andamento) {
    setErroForm("");
    salvar.reset();
    setEditando(item ?? null);
    setForm(
      item
        ? {
            data_andamento: item.data_andamento,
            tipo_andamento_id: item.tipo_andamento_id,
            descricao: item.descricao,
            proxima_acao: item.proxima_acao ?? "",
            data_proxima_acao: item.data_proxima_acao ?? "",
          }
        : { ...vazio, data_andamento: dataLocal() },
    );
    setAberto(true);
  }

  function enviar() {
    if (salvar.isPending) return;
    if (!form.data_andamento || !form.tipo_andamento_id || !form.descricao.trim()) {
      setErroForm("Preencha data, tipo e descrição.");
      return;
    }
    setErroForm("");
    salvar.mutate(
      {
        ...(editando ? { id: editando.id } : {}),
        input: {
          dataAndamento: form.data_andamento,
          tipoAndamentoId: form.tipo_andamento_id,
          descricao: form.descricao.trim(),
          proximaAcao: form.proxima_acao.trim() || null,
          dataProximaAcao: form.data_proxima_acao || null,
        },
      },
      {
        onSuccess: () => {
          setAberto(false);
          toast.success(editando ? "Andamento atualizado." : "Andamento adicionado.");
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }
  const [confirmar, setConfirmar] = useState<Andamento | null>(null);
  function excluir(item: Andamento) {
    if (remove.isPending) return;
    remove.mutate(item.id, {
      onSuccess: () => {
        setConfirmar(null);
        toast.success("Andamento excluído.");
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }
  if (!can("progress.read"))
    return (
      <EstadoVazio
        titulo="Acesso negado"
        descricao="Você não possui permissão para consultar andamentos."
      />
    );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">Histórico de acompanhamento</h2>
          <p className="text-sm text-muted-foreground">
            Registre perícias, decisões, contatos e próximas ações.
          </p>
        </div>
        <Dialog open={aberto} onOpenChange={(value) => !salvar.isPending && setAberto(value)}>
          {can("progress.manage") ? (
            <DialogTrigger asChild>
              <Button onClick={() => abrir()}>
                <Plus className="size-4" /> Adicionar andamento
              </Button>
            </DialogTrigger>
          ) : null}
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar andamento" : "Novo andamento"}</DialogTitle>
            </DialogHeader>
            {tiposRes.isError ? (
              <EstadoErro
                mensagem={errorMessage(tiposRes.error)}
                aoTentarNovamente={() => tiposRes.refetch()}
              />
            ) : null}
            {erroForm || salvar.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {erroForm || errorMessage(salvar.error)}
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoForm id="andamento-data" rotulo="Data" obrigatorio>
                <Input
                  id="andamento-data"
                  type="date"
                  value={form.data_andamento}
                  onChange={(e) => setForm({ ...form, data_andamento: e.target.value })}
                />
              </CampoForm>
              <CampoForm id="andamento-tipo" rotulo="Tipo" obrigatorio>
                <Select
                  value={form.tipo_andamento_id}
                  onValueChange={(v) => setForm({ ...form, tipo_andamento_id: v })}
                >
                  <SelectTrigger id="andamento-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos
                      .filter((t) => t.ativo || t.id === editando?.tipo_andamento_id)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                          {!t.ativo ? " (inativo)" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CampoForm>
              <div className="sm:col-span-2">
                <CampoForm id="andamento-descricao" rotulo="Descrição" obrigatorio>
                  <Textarea
                    id="andamento-descricao"
                    rows={4}
                    maxLength={10000}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </CampoForm>
              </div>
              <CampoForm id="andamento-acao" rotulo="Próxima ação">
                <Input
                  id="andamento-acao"
                  maxLength={5000}
                  value={form.proxima_acao}
                  onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
                />
              </CampoForm>
              <CampoForm id="andamento-prazo" rotulo="Prazo da próxima ação">
                <Input
                  id="andamento-prazo"
                  type="date"
                  value={form.data_proxima_acao}
                  onChange={(e) => setForm({ ...form, data_proxima_acao: e.target.value })}
                />
              </CampoForm>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setAberto(false)}
                disabled={salvar.isPending}
              >
                Cancelar
              </Button>
              <Button
                disabled={salvar.isPending || tiposRes.isLoading || tiposRes.isError}
                onClick={enviar}
              >
                {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <ListaSkeleton />
      ) : isError ? (
        <EstadoErro mensagem={errorMessage(error)} aoTentarNovamente={() => refetch()} />
      ) : andamentos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum andamento registrado."
          descricao="Registre o primeiro andamento para acompanhar este afastamento."
          acao={
            can("progress.manage") ? (
              <Button size="sm" onClick={() => abrir()}>
                <Plus className="size-4" /> Adicionar andamento
              </Button>
            ) : null
          }
        />
      ) : (
        <ol
          className="relative ml-2 border-l-2 border-border pl-5 sm:pl-6"
          aria-label="Andamentos, do mais recente ao mais antigo"
        >
          {andamentos.map((a) => (
            <li
              key={a.id}
              className="relative mb-4 rounded-md border border-border bg-card p-4 last:mb-0"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-primary bg-background sm:-left-[31px]"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <time
                      dateTime={a.data_andamento}
                      className="text-sm font-semibold tabular-nums"
                    >
                      {formatarData(a.data_andamento)}
                    </time>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                      {a.tipos_andamento_afastamento?.nome ?? "Tipo não encontrado"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{a.descricao}</p>
                </div>
                {can("progress.manage") ? (
                  <AcoesLinha
                    compacto
                    acoes={[
                      { rotulo: "Editar", icone: Pencil, aoClicar: () => abrir(a) },
                      {
                        rotulo: "Excluir",
                        icone: Trash2,
                        destrutiva: true,
                        aoClicar: () => setConfirmar(a),
                      },
                    ]}
                  />
                ) : null}
              </div>
              {a.proxima_acao ? (
                <div className="mt-3 flex gap-2 rounded-md bg-muted p-3 text-sm">
                  <CalendarClock
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">
                    <strong>Próxima ação:</strong> {a.proxima_acao}
                    {a.data_proxima_acao ? ` — prazo ${formatarData(a.data_proxima_acao)}` : ""}
                  </span>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog
        aberto={!!confirmar}
        aoMudar={(v) => !v && setConfirmar(null)}
        titulo="Excluir andamento?"
        descricao="O andamento será removido da linha do tempo. Os documentos vinculados permanecerão no afastamento."
        rotuloConfirmar="Excluir"
        destrutivo
        carregando={remove.isPending}
        aoConfirmar={() => confirmar && excluir(confirmar)}
      />
    </div>
  );
}

function dataLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
