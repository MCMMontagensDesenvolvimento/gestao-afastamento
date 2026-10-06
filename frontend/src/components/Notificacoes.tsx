import { Link } from "@tanstack/react-router";
import { Bell, CalendarClock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatarData } from "@/lib/dados";
import { useAuth } from "@/lib/auth/session";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { EstadoErro, EstadoVazio } from "@/components/padroes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notification } from "@/services/notifications";

export function Notificacoes() {
  const { can } = useAuth();
  const query = useNotifications(can("notifications.read"));
  const leitura = useMarkNotificationRead();
  const avisos = query.data?.data ?? [];
  const naoLidas = query.data?.meta.unreadCount ?? 0;

  if (!can("notifications.read")) return null;

  const marcarComoLida = (aviso: Notification) => {
    if (aviso.isRead || leitura.isPending || !can("notifications.read_state")) return;
    leitura.mutate(aviso.id, {
      onSuccess: () => toast.success("Notificação marcada como lida."),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) void query.refetch();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            query.isLoading
              ? "Carregando notificações"
              : query.isError
                ? "Notificações indisponíveis"
                : `${naoLidas} notificações não lidas`
          }
        >
          <Bell className="size-5" />
          {naoLidas && !query.isError ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">
              {naoLidas > 99 ? "99+" : naoLidas}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-sm p-0">
        <div className="border-b p-4">
          <h2 className="font-semibold">Notificações</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {query.isLoading
              ? "Carregando notificações..."
              : query.isError
                ? "Não foi possível atualizar as notificações."
                : query.isFetching
                  ? "Atualizando notificações..."
                  : naoLidas
                    ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}.`
                    : "Nenhuma notificação não lida."}
          </p>
        </div>
        <ScrollArea className="max-h-[60vh] [&>[data-radix-scroll-area-viewport]]:max-h-[60vh]">
          {query.isLoading ? (
            <div className="space-y-3 p-4" aria-busy="true" aria-label="Carregando notificações">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : query.error instanceof ApiError && query.error.status === 403 ? (
            <EstadoVazio
              titulo="Acesso negado"
              descricao="Você não tem permissão para consultar notificações."
              className="m-4"
            />
          ) : query.isError ? (
            <EstadoErro
              mensagem={errorMessage(query.error)}
              aoTentarNovamente={() => void query.refetch()}
              className="m-4"
            />
          ) : avisos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <Check className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Tudo em dia</p>
              <p className="text-xs text-muted-foreground">
                Nenhum benefício, retorno ou próxima ação vencendo nos próximos dias.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {avisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className={`relative flex items-start gap-2 p-4 ${aviso.isRead ? "bg-muted/30" : "bg-card"}`}
                >
                  {!aviso.isRead ? (
                    <span
                      className="absolute left-1.5 top-5 size-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                  {can("leaves.read") ? (
                    <Link
                      to="/afastamentos/$id"
                      params={{ id: aviso.context.afastamentoId }}
                      onClick={() => marcarComoLida(aviso)}
                      className={`flex min-w-0 flex-1 gap-3 hover:opacity-80 ${aviso.isRead ? "opacity-60" : ""}`}
                    >
                      <ConteudoNotificacao aviso={aviso} />
                    </Link>
                  ) : (
                    <div
                      className={`flex min-w-0 flex-1 gap-3 ${aviso.isRead ? "opacity-60" : ""}`}
                    >
                      <ConteudoNotificacao aviso={aviso} />
                    </div>
                  )}
                  {aviso.isRead ? (
                    <span
                      className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                      title="Notificação lida"
                    >
                      <Check className="size-3.5" /> Lida
                    </span>
                  ) : can("notifications.read_state") ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => marcarComoLida(aviso)}
                      disabled={leitura.isPending}
                      aria-label={`Marcar ${aviso.title} como lida`}
                    >
                      {leitura.isPending && leitura.variables === aviso.id ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <Check className="mr-1 size-3.5" />
                      )}
                      Marcar como lida
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function ConteudoNotificacao({ aviso }: { aviso: Notification }) {
  return (
    <>
      <CalendarClock
        className={`mt-0.5 size-4 shrink-0 ${aviso.isOverdue ? "text-destructive" : "text-primary"}`}
      />
      <span className="min-w-0 break-words">
        <strong className={`block text-sm ${aviso.isRead ? "font-normal" : ""}`}>
          {aviso.isOverdue ? (
            <span className="mr-1.5 rounded border border-destructive/30 bg-destructive/10 px-1 text-[10px] font-semibold uppercase text-destructive">
              Vencido
            </span>
          ) : null}
          {aviso.title}
          {!aviso.isRead ? <span className="sr-only"> (não lida)</span> : null}
        </strong>
        <span className="text-xs text-muted-foreground">{aviso.message}</span>
        <span className="mt-1 block text-xs">Prazo: {formatarData(aviso.dueDate)}</span>
      </span>
    </>
  );
}
