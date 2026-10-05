import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Download, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { configQuery, documentosQuery, formatarData, type DocumentoAfastamento } from "@/lib/dados";
import {
  AcoesLinha,
  CampoForm,
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

const TIPOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export function AfastamentoDocumentos({ afastamentoId }: { afastamentoId: string }) {
  const qc = useQueryClient();
  const { data: docs = [], isLoading, isError, refetch } = useQuery(documentosQuery(afastamentoId));
  const { data: tipos = [] } = useQuery(configQuery("tipos_documento_afastamento"));
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const enviar = useMutation({
    mutationFn: async () => {
      if (!arquivo || !data || !tipo) throw new Error("Preencha data, tipo e arquivo.");
      if (!TIPOS.includes(arquivo.type))
        throw new Error("Formato não permitido. Use PDF, JPG, PNG, DOC ou DOCX.");
      if (arquivo.size > 10 * 1024 * 1024) throw new Error("O arquivo deve ter no máximo 10 MB.");
      const limpo = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${afastamentoId}/${data.slice(0, 4)}/${crypto.randomUUID()}-${limpo}`;
      const up = await supabase.storage.from("afastamentos-documentos").upload(path, arquivo);
      if (up.error) throw up.error;
      const ins = await supabase.from("afastamento_documentos").insert({
        afastamento_id: afastamentoId,
        tipo_documento_id: tipo,
        data_documento: data,
        nome_arquivo: arquivo.name,
        storage_path: path,
      });
      if (ins.error) {
        await supabase.storage.from("afastamentos-documentos").remove([path]);
        throw ins.error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos", afastamentoId] });
      setAberto(false);
      setArquivo(null);
      setTipo("");
      toast.success("Documento enviado.");
    },
    onError: (e: Error) => toast.error(mensagemAmigavel(e, "Não foi possível enviar o arquivo.")),
  });
  const [confirmar, setConfirmar] = useState<DocumentoAfastamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  async function baixar(d: DocumentoAfastamento) {
    const { data: link, error } = await supabase.storage
      .from("afastamentos-documentos")
      .createSignedUrl(d.storage_path, 60, { download: d.nome_arquivo });
    if (error) {
      toast.error(mensagemAmigavel(error, "Não foi possível baixar o documento."));
      return;
    }
    window.open(link.signedUrl, "_blank", "noopener,noreferrer");
  }
  async function excluir(d: DocumentoAfastamento) {
    setExcluindo(true);
    try {
      const st = await supabase.storage.from("afastamentos-documentos").remove([d.storage_path]);
      if (st.error) {
        toast.error(mensagemAmigavel(st.error, "Não foi possível excluir o documento."));
        return;
      }
      const db = await supabase.from("afastamento_documentos").delete().eq("id", d.id);
      if (db.error) {
        toast.error(mensagemAmigavel(db.error, "Não foi possível excluir o documento."));
        return;
      }
      qc.invalidateQueries({ queryKey: ["documentos", afastamentoId] });
      toast.success("Documento excluído.");
    } finally {
      setExcluindo(false);
      setConfirmar(null);
    }
  }
  const grupos = Object.entries(
    docs.reduce<Record<string, DocumentoAfastamento[]>>((acc, d) => {
      const ano = d.data_documento.slice(0, 4);
      (acc[ano] ??= []).push(d);
      return acc;
    }, {}),
  ).sort(([a], [b]) => b.localeCompare(a));
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Arquivos organizados automaticamente pelo ano do documento.
          </p>
        </div>
        <Dialog open={aberto} onOpenChange={(v) => !enviar.isPending && setAberto(v)}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="size-4" /> Adicionar documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <CampoForm id="doc-data" rotulo="Data do documento" obrigatorio>
                <Input id="doc-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </CampoForm>
              <CampoForm id="doc-tipo" rotulo="Tipo" obrigatorio>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="doc-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CampoForm>
              <CampoForm id="doc-arquivo" rotulo="Arquivo" obrigatorio ajuda="PDF, imagem (JPG/PNG) ou Word, até 10 MB.">
                <Input
                  id="doc-arquivo"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={enviar.isPending}
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                />
              </CampoForm>
              {enviar.isError ? (
                <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {mensagemAmigavel(enviar.error, "Não foi possível enviar o arquivo.")}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setAberto(false)} disabled={enviar.isPending}>
                Cancelar
              </Button>
              <Button disabled={enviar.isPending} onClick={() => enviar.mutate()}>
                {enviar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {enviar.isPending ? "Enviando arquivo…" : "Enviar documento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <ListaSkeleton />
      ) : isError ? (
        <EstadoErro mensagem="Não foi possível carregar os documentos." aoTentarNovamente={() => refetch()} />
      ) : grupos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum documento anexado."
          descricao="Envie atestados, laudos e comunicados relacionados a este afastamento."
          acao={
            <Button size="sm" onClick={() => setAberto(true)}>
              <Plus className="size-4" /> Adicionar documento
            </Button>
          }
        />
      ) : (
        grupos.map(([ano, itens]) => (
          <section key={ano} className="mb-6 last:mb-0">
            <h3 className="mb-2 text-sm font-semibold">{ano}</h3>
            <ul className="divide-y divide-border rounded-md border border-border">
              {itens!.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3">
                  <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={d.nome_arquivo}>{d.nome_arquivo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatarData(d.data_documento)} · {d.tipos_documento_afastamento?.nome ?? "—"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => baixar(d)}>
                    <Download className="size-4" /> Baixar
                  </Button>
                  <AcoesLinha
                    compacto
                    acoes={[
                      { rotulo: "Baixar", icone: Download, aoClicar: () => baixar(d) },
                      { rotulo: "Excluir", icone: Trash2, destrutiva: true, aoClicar: () => setConfirmar(d) },
                    ]}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <ConfirmDialog
        aberto={!!confirmar}
        aoMudar={(v) => !v && setConfirmar(null)}
        titulo="Excluir documento?"
        descricao={`"${confirmar?.nome_arquivo ?? ""}" será removido, incluindo o arquivo armazenado. Esta ação não pode ser desfeita.`}
        rotuloConfirmar="Excluir"
        destrutivo
        carregando={excluindo}
        aoConfirmar={() => confirmar && excluir(confirmar)}
      />
    </div>
  );
}
