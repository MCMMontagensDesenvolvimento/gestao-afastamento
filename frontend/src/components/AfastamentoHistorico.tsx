import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { andamentosQuery, configQuery, formatarData, type Andamento } from "@/lib/dados";
import {
  AcoesLinha,
  ConfirmDialog,
  EstadoErro,
  EstadoVazio,
  ListaSkeleton,
  mensagemAmigavel,
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
import { Label } from "@/components/ui/label";
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
  data_andamento: new Date().toISOString().slice(0, 10),
  tipo_andamento_id: "",
  descricao: "",
  proxima_acao: "",
  data_proxima_acao: "",
};

export function AfastamentoHistorico({ afastamentoId }: { afastamentoId: string }) {
  const qc = useQueryClient();
  const { data: andamentos = [], isLoading, isError, refetch } = useQuery(andamentosQuery(afastamentoId));
  const { data: tipos = [] } = useQuery(configQuery("tipos_andamento_afastamento", false));
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Andamento | null>(null);
  const [form, setForm] = useState<Form>(vazio);

  function abrir(item?: Andamento) {
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
        : vazio,
    );
    setAberto(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.data_andamento || !form.tipo_andamento_id || !form.descricao.trim())
        throw new Error("Preencha data, tipo e descrição.");
      const payload = {
        afastamento_id: afastamentoId,
        ...form,
        descricao: form.descricao.trim(),
        proxima_acao: form.proxima_acao.trim() || null,
        data_proxima_acao: form.data_proxima_acao || null,
      };
      const resposta = editando
        ? await supabase.from("afastamento_andamentos").update(payload).eq("id", editando.id)
        : await supabase.from("afastamento_andamentos").insert(payload);
      if (resposta.error) throw resposta.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["andamentos", afastamentoId] });
      qc.invalidateQueries({ queryKey: ["proximas-acoes"] });
      setAberto(false);
      toast.success(editando ? "Andamento atualizado." : "Andamento adicionado.");
    },
    onError: (e: Error) => toast.error(mensagemAmigavel(e)),
  });

  const [confirmar, setConfirmar] = useState<Andamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function excluir(item: Andamento) {
    setExcluindo(true);
    const { error } = await supabase.from("afastamento_andamentos").delete().eq("id", item.id);
    setExcluindo(false);
    setConfirmar(null);
    if (error) {
      toast.error(mensagemAmigavel(error, "Não foi possível excluir o andamento."));
      return;
    }
    qc.invalidateQueries({ queryKey: ["andamentos", afastamentoId] });
    qc.invalidateQueries({ queryKey: ["documentos", afastamentoId] });
    qc.invalidateQueries({ queryKey: ["proximas-acoes"] });
    toast.success("Andamento excluído.");
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">Histórico de acompanhamento</h2>
          <p className="text-sm text-muted-foreground">
            Registre perícias, decisões, contatos e próximas ações.
          </p>
        </div>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button onClick={() => abrir()}>
              <Plus className="size-4" /> Adicionar andamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar andamento" : "Novo andamento"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Data *">
                <Input
                  type="date"
                  value={form.data_andamento}
                  onChange={(e) => setForm({ ...form, data_andamento: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Tipo *">
                <Select
                  value={form.tipo_andamento_id}
                  onValueChange={(v) => setForm({ ...form, tipo_andamento_id: v })}
                >
                  <SelectTrigger>
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
              </Campo>
              <div className="sm:col-span-2">
                <Campo rotulo="Descrição *">
                  <Textarea
                    rows={4}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </Campo>
              </div>
              <Campo rotulo="Próxima ação">
                <Input
                  value={form.proxima_acao}
                  onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Prazo da próxima ação">
                <Input
                  type="date"
                  value={form.data_proxima_acao}
                  onChange={(e) => setForm({ ...form, data_proxima_acao: e.target.value })}
                />
              </Campo>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setAberto(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button disabled={salvar.isPending} onClick={() => salvar.mutate()}>
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
        <EstadoErro mensagem="Não foi possível carregar o histórico." aoTentarNovamente={() => refetch()} />
      ) : andamentos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum andamento registrado."
          descricao="Registre o primeiro andamento para acompanhar este afastamento."
          acao={
            <Button size="sm" onClick={() => abrir()}>
              <Plus className="size-4" /> Adicionar andamento
            </Button>
          }
        />
      ) : (
        <ol className="relative ml-2 border-l-2 border-border pl-5 sm:pl-6" aria-label="Andamentos, do mais recente ao mais antigo">
          {andamentos.map((a) => (
            <li key={a.id} className="relative mb-4 rounded-md border border-border bg-card p-4 last:mb-0">
              <span
                aria-hidden="true"
                className="absolute -left-[27px] top-5 size-3 rounded-full border-2 border-primary bg-background sm:-left-[31px]"
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={a.data_andamento} className="text-sm font-semibold tabular-nums">
                      {formatarData(a.data_andamento)}
                    </time>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                      {a.tipos_andamento_afastamento?.nome ?? "Tipo não encontrado"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{a.descricao}</p>
                </div>
                <AcoesLinha
                  compacto
                  acoes={[
                    { rotulo: "Editar", icone: Pencil, aoClicar: () => abrir(a) },
                    { rotulo: "Excluir", icone: Trash2, destrutiva: true, aoClicar: () => setConfirmar(a) },
                  ]}
                />
              </div>
              {a.proxima_acao ? (
                <div className="mt-3 flex gap-2 rounded-md bg-muted p-3 text-sm">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
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
        descricao="Esta ação não pode ser desfeita. Documentos vinculados permanecerão no afastamento."
        rotuloConfirmar="Excluir"
        destrutivo
        carregando={excluindo}
        aoConfirmar={() => confirmar && excluir(confirmar)}
      />
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{rotulo}</Label>
      {children}
    </div>
  );
}
