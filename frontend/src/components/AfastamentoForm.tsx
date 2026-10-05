import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { colaboradoresQuery, configQuery, type Afastamento } from "@/lib/dados";
import { Skeleton } from "@/components/ui/skeleton";
import { mensagemAmigavel } from "@/components/padroes";
import { Loader2 } from "lucide-react";

const VAZIO = "__vazio__";

type Estado = {
  colaborador_id: string;
  obra_id: string;
  funcao_id: string;
  data_afastamento: string;
  tipo_beneficio_id: string;
  situacao_afastamento_id: string;
  data_inicio_beneficio: string;
  data_fim_beneficio: string;
  data_retorno_previsto: string;
  data_retorno_efetivo: string;
  data_aposentadoria: string;
  causa_cid: string;
  observacoes: string;
};

const ESTADO_INICIAL: Estado = {
  colaborador_id: "",
  obra_id: "",
  funcao_id: "",
  data_afastamento: "",
  tipo_beneficio_id: "",
  situacao_afastamento_id: "",
  data_inicio_beneficio: "",
  data_fim_beneficio: "",
  data_retorno_previsto: "",
  data_retorno_efetivo: "",
  data_aposentadoria: "",
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
    data_inicio_beneficio: afastamento.data_inicio_beneficio ?? "",
    data_fim_beneficio: afastamento.data_fim_beneficio ?? "",
    data_retorno_previsto: afastamento.data_retorno_previsto ?? "",
    data_retorno_efetivo: afastamento.data_retorno_efetivo ?? "",
    data_aposentadoria: afastamento.data_aposentadoria ?? "",
    causa_cid: afastamento.causa_cid ?? "",
    observacoes: afastamento.observacoes ?? "",
  };
}

export function AfastamentoForm({ afastamento }: { afastamento?: Afastamento | null }) {
  const editando = Boolean(afastamento);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const colaboradoresRes = useQuery(colaboradoresQuery(!editando));
  const obrasRes = useQuery(configQuery("obras", !editando));
  const funcoesRes = useQuery(configQuery("funcoes", !editando));
  const beneficiosRes = useQuery(configQuery("tipos_beneficio", !editando));
  const situacoesRes = useQuery(configQuery("situacoes_afastamento", !editando));

  const colaboradores = colaboradoresRes.data ?? [];
  const manterAtivoOuAtual = (idAtual: string) => (item: { id: string; ativo: boolean }) => item.ativo || item.id === idAtual;
  const obras = (obrasRes.data ?? []).filter(manterAtivoOuAtual(afastamento?.obra_id ?? ""));
  const funcoes = (funcoesRes.data ?? []).filter(manterAtivoOuAtual(afastamento?.funcao_id ?? ""));
  const beneficios = (beneficiosRes.data ?? []).filter(manterAtivoOuAtual(afastamento?.tipo_beneficio_id ?? ""));
  const situacoes = (situacoesRes.data ?? []).filter(manterAtivoOuAtual(afastamento?.situacao_afastamento_id ?? ""));

  const carregandoListas =
    colaboradoresRes.isLoading ||
    obrasRes.isLoading ||
    funcoesRes.isLoading ||
    beneficiosRes.isLoading ||
    situacoesRes.isLoading;

  const [form, setForm] = useState<Estado>(() => estadoDe(afastamento));
  const [buscaColab, setBuscaColab] = useState("");

  useEffect(() => {
    if (!afastamento) return;
    setForm(estadoDe(afastamento));
  }, [afastamento]);

  const colaboradoresFiltrados = useMemo(() => {
    const termo = buscaColab.trim().toLowerCase();
    if (!termo) return colaboradores;
    return colaboradores.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.codigo_interno.toLowerCase().includes(termo),
    );
  }, [colaboradores, buscaColab]);

  function definir<K extends keyof Estado>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoEscolherColaborador(id: string) {
    const colab = colaboradores.find((c) => c.id === id);
    setForm((atual) => ({
      ...atual,
      colaborador_id: id,
      obra_id: atual.obra_id || (colab?.obra_id ?? ""),
      funcao_id: atual.funcao_id || (colab?.funcao_id ?? ""),
    }));
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        colaborador_id: form.colaborador_id,
        obra_id: form.obra_id || null,
        funcao_id: form.funcao_id || null,
        data_afastamento: form.data_afastamento,
        tipo_beneficio_id: form.tipo_beneficio_id || null,
        situacao_afastamento_id: form.situacao_afastamento_id,
        data_inicio_beneficio: form.data_inicio_beneficio || null,
        data_fim_beneficio: form.data_fim_beneficio || null,
        data_retorno_previsto: form.data_retorno_previsto || null,
        data_retorno_efetivo: form.data_retorno_efetivo || null,
        data_aposentadoria: form.data_aposentadoria || null,
        causa_cid: form.causa_cid || null,
        observacoes: form.observacoes || null,
      };

      if (afastamento) {
        const { error } = await supabase
          .from("afastamentos")
          .update(payload)
          .eq("id", afastamento.id);
        if (error) throw error;
        return afastamento.id;
      }
      const { data, error } = await supabase
        .from("afastamentos")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["afastamentos"] });
      queryClient.invalidateQueries({ queryKey: ["afastamento", id] });
      queryClient.invalidateQueries({ queryKey: ["contagem-afastamentos"] });
      toast.success(editando ? "Afastamento atualizado." : "Afastamento cadastrado.");
      navigate({ to: "/afastamentos/$id", params: { id } });
    },
    onError: (erro: Error) => toast.error(mensagemAmigavel(erro)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.colaborador_id) {
      toast.error("Selecione o colaborador.");
      return;
    }
    if (!form.data_afastamento) {
      toast.error("Informe a data do afastamento.");
      return;
    }
    if (!form.situacao_afastamento_id) {
      toast.error("Selecione a situação.");
      return;
    }
    salvar.mutate();
  }

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
    <form onSubmit={enviar} className="max-w-4xl space-y-6" aria-busy={salvar.isPending}>
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
              onChange={(e) => setBuscaColab(e.target.value)}
              className="mt-1.5"
              disabled={editando}
            />
            <Select
              value={form.colaborador_id}
              onValueChange={aoEscolherColaborador}
              disabled={editando}
            >
              <SelectTrigger id="colaborador" className="mt-2">
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {colaboradoresFiltrados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo_interno} — {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CampoSelect
            id="obra"
            rotulo="Obra"
            valor={form.obra_id}
            aoMudar={(v) => definir("obra_id", v)}
            itens={obras}
            permiteVazio
          />
          <CampoSelect
            id="funcao"
            rotulo="Função"
            valor={form.funcao_id}
            aoMudar={(v) => definir("funcao_id", v)}
            itens={funcoes}
            permiteVazio
          />
          <CampoData
            id="data_afastamento"
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
          />
          <CampoData
            id="inicio"
            rotulo="Início do benefício"
            valor={form.data_inicio_beneficio}
            aoMudar={(v) => definir("data_inicio_beneficio", v)}
          />
          <CampoData
            id="fim"
            rotulo="Fim do benefício"
            valor={form.data_fim_beneficio}
            aoMudar={(v) => definir("data_fim_beneficio", v)}
          />
          <CampoData
            id="previsto"
            rotulo="Retorno previsto"
            valor={form.data_retorno_previsto}
            aoMudar={(v) => definir("data_retorno_previsto", v)}
          />
          <CampoData
            id="efetivo"
            rotulo="Retorno efetivo"
            valor={form.data_retorno_efetivo}
            aoMudar={(v) => definir("data_retorno_efetivo", v)}
          />
          <CampoData
            id="aposentadoria"
            rotulo="Data da aposentadoria"
            valor={form.data_aposentadoria}
            aoMudar={(v) => definir("data_aposentadoria", v)}
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
            />
          </div>
          <div>
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => definir("observacoes", e.target.value)}
              className="mt-1.5"
              rows={4}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
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
          <span className="ml-0.5 text-primary" aria-hidden="true">*</span>
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
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
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
      />
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
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  itens: Array<{ id: string; nome: string }>;
  permiteVazio?: boolean;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{rotuloComObrigatorio(rotulo)}</Label>
      <Select
        value={valor || (permiteVazio ? VAZIO : "")}
        onValueChange={(v) => aoMudar(v === VAZIO ? "" : v)}
      >
        <SelectTrigger id={id} className="mt-1.5">
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
    </div>
  );
}
