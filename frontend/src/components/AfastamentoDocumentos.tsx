import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Download, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/session";
import { errorMessage } from "@/lib/api/errors";
import { documentosQuery, useDocumentMutations } from "@/hooks/use-documents";
import type { LeaveDocument } from "@/services/documents";
import { configQuery } from "@/lib/dados";
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

const TIPOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export function AfastamentoDocumentos({ afastamentoId }: { afastamentoId: string }) {
  const { can } = useAuth();
  const { upload: enviar, remove, download } = useDocumentMutations(afastamentoId);
  const {
    data: docs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({ ...documentosQuery(afastamentoId), enabled: can("documents.read") });
  const tiposRes = useQuery({
    ...configQuery("tipos_documento_afastamento"),
    enabled: can("documents.upload"),
  });
  const tipos = tiposRes.data ?? [];
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroForm, setErroForm] = useState("");
  const [confirmar, setConfirmar] = useState<LeaveDocument | null>(null);
  function abrirUpload(value: boolean) {
    if (enviar.isPending) return;
    setAberto(value);
    setErroForm("");
    enviar.reset();
    if (value) setArquivo(null);
  }
  function enviarArquivo() {
    if (enviar.isPending) return;
    if (!arquivo || !tipo) {
      setErroForm("Selecione o tipo e o arquivo.");
      return;
    }
    if (!TIPOS.includes(arquivo.type) || !/\.(pdf|jpe?g|png|docx?)$/i.test(arquivo.name)) {
      setErroForm("Formato não permitido. Use PDF, JPG, PNG, DOC ou DOCX.");
      return;
    }
    if (arquivo.size === 0 || arquivo.size > 10 * 1024 * 1024) {
      setErroForm("Envie um arquivo não vazio com até 10 MB.");
      return;
    }
    setErroForm("");
    enviar.mutate(
      { file: arquivo, tipoDocumentoId: tipo },
      {
        onSuccess: () => {
          setAberto(false);
          setArquivo(null);
          setTipo("");
          toast.success("Documento enviado.");
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }
  function baixar(item: LeaveDocument) {
    if (download.isPending) return;
    download.mutate(item, { onError: (error) => toast.error(errorMessage(error)) });
  }
  function excluir(item: LeaveDocument) {
    if (remove.isPending) return;
    remove.mutate(item.id, {
      onSuccess: () => {
        setConfirmar(null);
        toast.success("Documento excluído.");
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }
  const grupos = Object.entries(
    docs.reduce<Record<string, LeaveDocument[]>>((acc, d) => {
      const ano = new Date(d.createdAt).getFullYear().toString();
      (acc[ano] ??= []).push(d);
      return acc;
    }, {}),
  ).sort(([a], [b]) => b.localeCompare(a));
  if (!can("documents.read"))
    return (
      <EstadoVazio
        titulo="Acesso negado"
        descricao="Você não possui permissão para consultar documentos."
      />
    );
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">Documentos</h2>
          <p className="text-sm text-muted-foreground">Arquivos organizados pelo ano de envio.</p>
        </div>
        <Dialog open={aberto} onOpenChange={abrirUpload}>
          {can("documents.upload") ? (
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Plus className="size-4" /> Adicionar documento
              </Button>
            </DialogTrigger>
          ) : null}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {tiposRes.isError ? (
                <EstadoErro
                  mensagem={errorMessage(tiposRes.error)}
                  aoTentarNovamente={() => tiposRes.refetch()}
                />
              ) : null}
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
              <CampoForm
                id="doc-arquivo"
                rotulo="Arquivo"
                obrigatorio
                ajuda="PDF, imagem (JPG/PNG) ou Word, até 10 MB."
              >
                <Input
                  id="doc-arquivo"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={enviar.isPending}
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                />
              </CampoForm>
              {erroForm || enviar.isError ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {erroForm || errorMessage(enviar.error)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setAberto(false)}
                disabled={enviar.isPending}
              >
                Cancelar
              </Button>
              <Button
                disabled={enviar.isPending || tiposRes.isLoading || tiposRes.isError}
                onClick={enviarArquivo}
              >
                {enviar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {enviar.isPending ? "Enviando arquivo…" : "Enviar documento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {download.isPending ? (
        <p role="status" className="mb-3 text-sm text-muted-foreground">
          Preparando download…
        </p>
      ) : null}
      {isLoading ? (
        <ListaSkeleton />
      ) : isError ? (
        <EstadoErro mensagem={errorMessage(error)} aoTentarNovamente={() => refetch()} />
      ) : grupos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum documento anexado."
          descricao="Envie atestados, laudos e comunicados relacionados a este afastamento."
          acao={
            can("documents.upload") ? (
              <Button size="sm" onClick={() => abrirUpload(true)}>
                <Plus className="size-4" /> Adicionar documento
              </Button>
            ) : null
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
                    <p className="truncate text-sm font-medium" title={d.originalName}>
                      {d.originalName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(d.createdAt))} ·{" "}
                      {d.tipoDocumento?.nome ?? "—"}
                    </p>
                  </div>
                  {can("documents.download") ? (
                    <Button
                      disabled={download.isPending}
                      variant="outline"
                      size="sm"
                      className="hidden sm:inline-flex"
                      onClick={() => baixar(d)}
                    >
                      <Download className="size-4" /> Baixar
                    </Button>
                  ) : null}
                  {can("documents.download") || can("documents.delete") ? (
                    <AcoesLinha
                      compacto
                      acoes={[
                        ...(can("documents.download")
                          ? [{ rotulo: "Baixar", icone: Download, aoClicar: () => baixar(d) }]
                          : []),
                        ...(can("documents.delete")
                          ? [
                              {
                                rotulo: "Excluir",
                                icone: Trash2,
                                destrutiva: true,
                                aoClicar: () => setConfirmar(d),
                              },
                            ]
                          : []),
                      ]}
                    />
                  ) : null}
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
        descricao={`"${confirmar?.originalName ?? ""}" será removido, incluindo o arquivo armazenado. Esta ação não pode ser desfeita.`}
        rotuloConfirmar="Excluir"
        destrutivo
        carregando={remove.isPending}
        aoConfirmar={() => confirmar && excluir(confirmar)}
      />
    </div>
  );
}
