import { type ReactNode } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  MoreVertical,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApiError, errorMessage } from "@/lib/api/errors";

/* ---------- Seções e cartões ---------- */

export function Secao({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {titulo}
          </h2>
          {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
        </div>
        {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
      </div>
      {children}
    </section>
  );
}

/* ---------- Estados ---------- */

export function EstadoVazio({
  titulo,
  descricao,
  acao,
  className,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-10 text-center",
        className,
      )}
    >
      <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{titulo}</p>
      {descricao ? <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p> : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}

export function EstadoErro({
  mensagem = "Não foi possível carregar as informações.",
  aoTentarNovamente,
  className,
}: {
  mensagem?: string;
  aoTentarNovamente?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-10 text-center",
        className,
      )}
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium">{mensagem}</p>
      {!/permiss[aã]o|acesso negado/i.test(mensagem) ? (
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente em instantes.
        </p>
      ) : null}
      {aoTentarNovamente ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={aoTentarNovamente}>
          <RotateCcw className="size-4" /> Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function TabelaSkeleton({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ListaSkeleton({ itens = 3 }: { itens?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: itens }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

/** Mensagem amigável a partir de erros técnicos. */
export function mensagemAmigavel(erro: unknown, padrao = "Não foi possível concluir a operação.") {
  if (erro instanceof ApiError) return errorMessage(erro);
  const texto = erro instanceof Error ? erro.message : String(erro ?? "");
  if (!texto) return padrao;
  if (/fetch|network|failed to/i.test(texto)) return "Falha de conexão. Tente novamente.";
  if (/duplicate|unique/i.test(texto)) return "Já existe um registro com esses dados.";
  if (/foreign key|violates/i.test(texto))
    return "Este registro possui vínculos e não pode ser alterado dessa forma.";
  if (/mime|size|exceeded|payload/i.test(texto))
    return "Arquivo não aceito. Verifique o formato e o tamanho (até 10 MB).";
  // Mensagens já escritas em português pela própria aplicação.
  if (/[ãçéêíóõú]/i.test(texto) || /^(Preencha|Informe|Selecione|Formato|O arquivo)/.test(texto))
    return texto;
  return padrao;
}

/* ---------- Badges ---------- */

export function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
        ativo
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", ativo ? "bg-primary" : "bg-muted-foreground")}
      />
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

/* ---------- Confirmação ---------- */

export function ConfirmDialog({
  aberto,
  aoMudar,
  titulo,
  descricao,
  rotuloConfirmar = "Confirmar",
  destrutivo = false,
  carregando = false,
  aoConfirmar,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  titulo: string;
  descricao: ReactNode;
  rotuloConfirmar?: string;
  destrutivo?: boolean;
  carregando?: boolean;
  aoConfirmar: () => void;
}) {
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => !carregando && aoMudar(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={carregando}
            className={cn(
              destrutivo && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={(e) => {
              e.preventDefault();
              aoConfirmar();
            }}
          >
            {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- Ações por linha ---------- */

export type AcaoLinha = {
  rotulo: string;
  icone: React.ComponentType<{ className?: string }>;
  aoClicar: () => void;
  destrutiva?: boolean;
  titulo?: string | undefined;
};

/** Ícones no desktop; menu "mais ações" em telas menores. */
export function AcoesLinha({
  acoes,
  compacto = false,
}: {
  acoes: AcaoLinha[];
  compacto?: boolean;
}) {
  return (
    <>
      <div className={cn("hidden justify-end gap-1", !compacto && "lg:flex")}>
        {acoes.map((a) => (
          <Button
            key={a.rotulo}
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={a.aoClicar}
            aria-label={a.rotulo}
            title={a.titulo ?? a.rotulo}
          >
            <a.icone className="size-4" />
          </Button>
        ))}
      </div>
      <div className={cn("flex justify-end", !compacto && "lg:hidden")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9" aria-label="Mais ações">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {acoes.map((a) => (
              <DropdownMenuItem
                key={a.rotulo}
                onSelect={a.aoClicar}
                className={a.destrutiva ? "text-destructive focus:text-destructive" : undefined}
              >
                <a.icone className="mr-2 size-4" /> {a.rotulo}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

/* ---------- Paginação server-side ---------- */

export function Paginacao({
  pagina,
  totalPaginas,
  total,
  tamanho,
  setPagina,
  setTamanho,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanho: number;
  setPagina: (p: number) => void;
  setTamanho?: ((tamanho: number) => void) | undefined;
}) {
  if (total === 0) return null;
  const inicio = (pagina - 1) * tamanho + 1;
  const fim = Math.min(total, pagina * tamanho);
  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row"
    >
      <span>
        {inicio}–{fim} de {total} {total === 1 ? "registro" : "registros"}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {setTamanho ? (
          <label className="flex items-center gap-2 text-xs">
            Por página
            <select
              aria-label="Registros por página"
              className="rounded-md border border-input bg-card p-2 text-foreground"
              value={tamanho}
              onChange={(event) => setTamanho(Number(event.target.value))}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" /> Anterior
        </Button>
        <span className="tabular-nums">
          {pagina} / {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Próxima página"
        >
          Próxima <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}

/* ---------- Filtros ---------- */

export const TODOS = "todos";

export type OpcaoFiltro = { id: string; nome: string };

export function FiltroSelect({
  id,
  rotulo,
  valor,
  aoMudar,
  itens,
  rotuloTodos = "Todas",
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  itens: OpcaoFiltro[];
  rotuloTodos?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {rotulo}
      </Label>
      <Select value={valor} onValueChange={aoMudar}>
        <SelectTrigger id={id} className="bg-card">
          <SelectValue placeholder={rotulo} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{rotuloTodos}</SelectItem>
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

/**
 * Barra de filtros padrão: busca sempre visível; demais filtros em grade no
 * desktop e em painel lateral no celular.
 */
export function BarraFiltros({
  busca,
  aoBuscar,
  placeholderBusca,
  filtrosAtivos,
  aoLimpar,
  children,
  colunas = "lg:grid-cols-4",
}: {
  busca: string;
  aoBuscar: (v: string) => void;
  placeholderBusca: string;
  filtrosAtivos: number;
  aoLimpar: () => void;
  children: ReactNode;
  colunas?: string;
}) {
  const algumAtivo = filtrosAtivos > 0 || busca.trim() !== "";
  return (
    <div className="rounded-md border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1 space-y-1.5 md:max-w-xs">
          <Label htmlFor="filtro-busca" className="text-xs text-muted-foreground">
            Buscar
          </Label>
          <Input
            id="filtro-busca"
            type="search"
            placeholder={placeholderBusca}
            value={busca}
            onChange={(e) => aoBuscar(e.target.value)}
          />
        </div>

        <div className={cn("hidden min-w-0 flex-1 gap-3 md:grid md:grid-cols-2", colunas)}>
          {children}
        </div>

        <div className="flex gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1">
                <SlidersHorizontal className="size-4" /> Filtros
                {filtrosAtivos ? (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    {filtrosAtivos}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Refine a lista exibida.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid gap-4">{children}</div>
              {algumAtivo ? (
                <Button variant="ghost" className="mt-4 w-full" onClick={aoLimpar}>
                  <X className="size-4" /> Limpar filtros
                </Button>
              ) : null}
            </SheetContent>
          </Sheet>
          {algumAtivo ? (
            <Button variant="ghost" onClick={aoLimpar} aria-label="Limpar filtros">
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        {algumAtivo ? (
          <Button variant="ghost" className="hidden shrink-0 md:inline-flex" onClick={aoLimpar}>
            <X className="size-4" /> Limpar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Contêiner de listagem ---------- */

/** Classes para tabela com cabeçalho fixo e rolagem vertical. */
export const TABELA_CONTAINER = "max-h-[60vh]";
export const CABECALHO_FIXO =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--color-border)]";

export function CampoForm({
  id,
  rotulo,
  obrigatorio,
  ajuda,
  children,
  className,
}: {
  id?: string;
  rotulo: string;
  obrigatorio?: boolean;
  ajuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio ? (
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
        ) : null}
        {obrigatorio ? <span className="sr-only"> (obrigatório)</span> : null}
      </Label>
      {children}
      {ajuda ? <p className="text-xs text-muted-foreground">{ajuda}</p> : null}
    </div>
  );
}
