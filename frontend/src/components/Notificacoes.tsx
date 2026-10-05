import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { Bell, CalendarClock, Check } from "lucide-react";
import { afastamentosQuery, formatarData, proximasAcoesQuery } from "@/lib/dados";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type Aviso = {
  id: string;
  afastamentoId: string;
  titulo: string;
  detalhe: string;
  data: string;
  urgente: boolean;
};

const STORAGE_KEY = "gestao-afastados:notificacoes-lidas";

export function Notificacoes() {
  const [lidas, setLidas] = useState<Set<string>>(new Set());
  const { data: afastamentos = [] } = useQuery(afastamentosQuery());
  const { data: acoes = [] } = useQuery(proximasAcoesQuery());

  useEffect(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(salvas)) setLidas(new Set(salvas.filter((id): id is string => typeof id === "string")));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const marcarComoLida = (id: string) => {
    setLidas((atuais) => {
      const proximas = new Set(atuais);
      proximas.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...proximas].slice(-500)));
      return proximas;
    });
  };

  const avisos = useMemo(() => {
    const hoje = startOfDay(new Date());
    const lista: Aviso[] = [];
    for (const a of afastamentos) {
      if (a.situacoes_afastamento?.classificacao_sistema !== "ATIVO") continue;
      const nome = a.colaboradores?.nome ?? "Colaborador";
      if (a.data_fim_beneficio) {
        const dias = differenceInCalendarDays(parseISO(a.data_fim_beneficio), hoje);
        if (dias <= 30)
          lista.push({
            id: `fim-${a.id}-${a.data_fim_beneficio}`,
            afastamentoId: a.id,
            titulo: dias < 0 ? "Benefício vencido" : "Fim do benefício próximo",
            detalhe: `${nome} — ${formatarData(a.data_fim_beneficio)}`,
            data: a.data_fim_beneficio,
            urgente: dias < 0,
          });
      }
      if (a.data_retorno_previsto && !a.data_retorno_efetivo) {
        const dias = differenceInCalendarDays(parseISO(a.data_retorno_previsto), hoje);
        if (dias <= 15)
          lista.push({
            id: `ret-${a.id}-${a.data_retorno_previsto}`,
            afastamentoId: a.id,
            titulo: dias < 0 ? "Retorno previsto vencido" : "Retorno previsto próximo",
            detalhe: `${nome} — ${formatarData(a.data_retorno_previsto)}`,
            data: a.data_retorno_previsto,
            urgente: dias < 0,
          });
      }
    }
    for (const acao of acoes) {
      if (!acao.data_proxima_acao) continue;
      const dias = differenceInCalendarDays(parseISO(acao.data_proxima_acao), hoje);
      if (dias > 15) continue;
      const af = acao.afastamentos as unknown as {
        id: string;
        colaboradores: { nome: string } | null;
      } | null;
      lista.push({
        id: `acao-${acao.id}-${acao.data_proxima_acao}`,
        afastamentoId: acao.afastamento_id,
        titulo: dias < 0 ? "Próxima ação vencida" : "Próxima ação",
        detalhe: `${af?.colaboradores?.nome ?? "Colaborador"} — ${acao.proxima_acao ?? "Verificar acompanhamento"}`,
        data: acao.data_proxima_acao,
        urgente: dias < 0,
      });
    }
    return lista.sort((a, b) => a.data.localeCompare(b.data));
  }, [afastamentos, acoes]);

  const naoLidas = avisos.filter((aviso) => !lidas.has(aviso.id)).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${naoLidas} notificações não lidas`}
        >
          <Bell className="size-5" />
          {naoLidas ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">
              {naoLidas > 99 ? "99+" : naoLidas}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-sm p-0">
        <div className="border-b p-4">
          <h2 className="font-semibold">Notificações</h2>
          <p className="text-xs text-muted-foreground">
            {naoLidas ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}.` : "Nenhuma notificação não lida."}
          </p>
        </div>
        <ScrollArea className="max-h-[60vh]">
          {avisos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <Check className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Tudo em dia</p>
              <p className="text-xs text-muted-foreground">
                Nenhum benefício, retorno ou próxima ação vencendo nos próximos dias.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {avisos.map((a) => {
                const lida = lidas.has(a.id);
                return (
                  <div key={a.id} className={`relative flex items-start gap-2 p-4 ${lida ? "bg-muted/30" : "bg-card"}`}>
                    {!lida ? <span className="absolute left-1.5 top-5 size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
                    <Link
                      to="/afastamentos/$id"
                      params={{ id: a.afastamentoId }}
                      onClick={() => marcarComoLida(a.id)}
                      className={`flex min-w-0 flex-1 gap-3 hover:opacity-80 ${lida ? "opacity-60" : ""}`}
                    >
                      <CalendarClock
                        className={`mt-0.5 size-4 shrink-0 ${a.urgente ? "text-destructive" : "text-primary"}`}
                      />
                      <span>
                        <strong className={`block text-sm ${lida ? "font-normal" : ""}`}>
                          {a.urgente ? (
                            <span className="mr-1.5 rounded border border-destructive/30 bg-destructive/10 px-1 text-[10px] font-semibold uppercase text-destructive">
                              Vencido
                            </span>
                          ) : null}
                          {a.titulo}
                          {!lida ? <span className="sr-only"> (não lida)</span> : null}
                        </strong>
                        <span className="text-xs text-muted-foreground">{a.detalhe}</span>
                        <span className="mt-1 block text-xs">Prazo: {formatarData(a.data)}</span>
                      </span>
                    </Link>
                    {lida ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title="Notificação lida">
                        <Check className="size-3.5" /> Lida
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={() => marcarComoLida(a.id)}
                        aria-label={`Marcar ${a.titulo} como lida`}
                      >
                        <Check className="mr-1 size-3.5" />
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
