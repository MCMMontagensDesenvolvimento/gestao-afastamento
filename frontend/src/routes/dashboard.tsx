import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isBefore,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { AlertTriangle, CalendarCheck, UserRoundCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoErro } from "@/components/padroes";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { afastamentosQuery, configQuery, formatarData } from "@/lib/dados";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Controle de Afastamentos MCM" },
      {
        name: "description",
        content: "Indicadores operacionais dos afastamentos acompanhados pela MCM.",
      },
    ],
  }),
  component: Dashboard,
});

const TODOS = "todos";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const chartConfig = {
  quantidade: { label: "Afastamentos", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Prioridade = {
  id: string;
  afastamentoId: string;
  colaborador: string;
  obra: string;
  pendencia: string;
  prazo: string;
  dias: number;
  vencida: boolean;
};

function Dashboard() {
  const { data: afastamentos = [], isLoading, isError, refetch } = useQuery(afastamentosQuery());
  const { data: obras = [] } = useQuery(configQuery("obras", false));
  const [obraId, setObraId] = useState(TODOS);

  const dados = useMemo(() => {
    const hoje = startOfDay(new Date());
    const filtrados = afastamentos.filter((item) => obraId === TODOS || item.obra_id === obraId);
    const ativos = filtrados.filter(
      (item) => item.situacoes_afastamento?.classificacao_sistema === "ATIVO",
    );

    const beneficiosVencidos = ativos.filter(
      (item) => item.data_fim_beneficio && isBefore(parseISO(item.data_fim_beneficio), hoje),
    ).length;

    const retornos15Dias = ativos.filter((item) => {
      if (!item.data_retorno_previsto || item.data_retorno_efetivo) return false;
      const data = parseISO(item.data_retorno_previsto);
      const dias = differenceInCalendarDays(data, hoje);
      return dias >= 0 && dias <= 15;
    }).length;

    const mapaObras = new Map<string, number>();
    for (const item of ativos) {
      const nome = item.obras?.nome ?? "Sem obra informada";
      mapaObras.set(nome, (mapaObras.get(nome) ?? 0) + 1);
    }
    const porObra = [...mapaObras.entries()]
      .map(([obra, quantidade]) => ({ obra, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade || a.obra.localeCompare(b.obra));

    const inicio = startOfMonth(subMonths(hoje, 11));
    const porMes = Array.from({ length: 12 }, (_, indice) => {
      const data = addMonths(inicio, indice);
      const inicioMes = startOfMonth(data);
      const fimMes = endOfMonth(data);
      return {
        mes: `${MESES[data.getMonth()] ?? ""}/${format(data, "yy")}`,
        quantidade: filtrados.filter((item) =>
          isWithinInterval(parseISO(item.data_afastamento), { start: inicioMes, end: fimMes }),
        ).length,
      };
    });

    const faixas = [
      { faixa: "Até 30 dias", quantidade: 0 },
      { faixa: "31 a 90 dias", quantidade: 0 },
      { faixa: "91 a 180 dias", quantidade: 0 },
      { faixa: "Acima de 180 dias", quantidade: 0 },
    ];
    for (const item of ativos) {
      const dias = Math.max(0, differenceInCalendarDays(hoje, parseISO(item.data_afastamento)));
      if (dias <= 30) faixas[0]!.quantidade += 1;
      else if (dias <= 90) faixas[1]!.quantidade += 1;
      else if (dias <= 180) faixas[2]!.quantidade += 1;
      else faixas[3]!.quantidade += 1;
    }

    const prioridades: Prioridade[] = [];
    for (const item of ativos) {
      const base = {
        afastamentoId: item.id,
        colaborador: item.colaboradores?.nome ?? "Colaborador",
        obra: item.obras?.nome ?? "—",
      };

      if (item.data_fim_beneficio) {
        const data = parseISO(item.data_fim_beneficio);
        const dias = differenceInCalendarDays(data, hoje);
        if (dias <= 30) {
          prioridades.push({
            ...base,
            id: `beneficio-${item.id}`,
            pendencia: dias < 0 ? "Benefício vencido" : "Benefício próximo do vencimento",
            prazo: item.data_fim_beneficio,
            dias,
            vencida: dias < 0,
          });
        }
      }

      if (item.data_retorno_previsto && !item.data_retorno_efetivo) {
        const data = parseISO(item.data_retorno_previsto);
        const dias = differenceInCalendarDays(data, hoje);
        if (dias <= 15) {
          prioridades.push({
            ...base,
            id: `retorno-${item.id}`,
            pendencia: dias < 0 ? "Retorno previsto vencido" : "Retorno previsto",
            prazo: item.data_retorno_previsto,
            dias,
            vencida: dias < 0,
          });
        }
      }
    }
    prioridades.sort((a, b) => {
      if (a.vencida !== b.vencida) return a.vencida ? -1 : 1;
      return a.prazo.localeCompare(b.prazo);
    });

    return {
      ativos: ativos.length,
      beneficiosVencidos,
      retornos15Dias,
      porObra,
      porMes,
      faixas,
      prioridades,
    };
  }, [afastamentos, obraId]);

  return (
    <AppLayout
      titulo="Dashboard"
      descricao="Visão operacional dos afastamentos e prazos que exigem atenção."
      acoes={
        <Select value={obraId} onValueChange={setObraId}>
          <SelectTrigger className="w-full bg-card sm:w-52" aria-label="Filtrar por obra">
            <SelectValue placeholder="Filtrar por obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as obras</SelectItem>
            {obras.map((obra) => (
              <SelectItem key={obra.id} value={obra.id}>
                {obra.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {isError ? (
        <EstadoErro
          mensagem="Não foi possível carregar os indicadores."
          aoTentarNovamente={() => refetch()}
        />
      ) : (
      <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador
          titulo="Afastamentos ativos"
          valor={dados.ativos}
          icone={UserRoundCheck}
          carregando={isLoading}
        />
        <Indicador
          titulo="Benefícios vencidos"
          valor={dados.beneficiosVencidos}
          icone={AlertTriangle}
          destaque={dados.beneficiosVencidos > 0}
          carregando={isLoading}
        />
        <Indicador
          titulo="Retornos previstos em 15 dias"
          valor={dados.retornos15Dias}
          icone={CalendarCheck}
          carregando={isLoading}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <GraficoCard carregando={isLoading} titulo="Afastamentos ativos por obra" descricao="Distribuição atual por local de trabalho.">
          {dados.porObra.length ? (
            <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[300px]">
              <BarChart data={dados.porObra} layout="vertical" margin={{ left: 12, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="obra" type="category" width={110} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <SemDados />
          )}
        </GraficoCard>

        <GraficoCard carregando={isLoading} titulo="Novos afastamentos por mês" descricao="Registros realizados nos últimos 12 meses.">
          <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[300px]">
            <LineChart data={dados.porMes} margin={{ left: 4, right: 16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} minTickGap={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="quantidade"
                type="monotone"
                stroke="var(--color-quantidade)"
                strokeWidth={2}
                dot={{ fill: "var(--color-quantidade)" }}
              />
            </LineChart>
          </ChartContainer>
        </GraficoCard>

        <GraficoCard carregando={isLoading} titulo="Duração dos afastamentos ativos" descricao="Quantidade por tempo decorrido desde o afastamento.">
          <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[300px]">
            <BarChart data={dados.faixas} margin={{ left: 4, right: 16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="faixa" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </GraficoCard>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Pendências prioritárias</CardTitle>
            <p className="text-sm text-muted-foreground">Benefícios e retornos vencidos ou próximos.</p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Pendência</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="text-right">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.prioridades.length ? (
                    dados.prioridades.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link
                            to="/afastamentos/$id"
                            params={{ id: item.afastamentoId }}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {item.colaborador}
                          </Link>
                          <span className="block text-xs text-muted-foreground">{item.obra}</span>
                        </TableCell>
                        <TableCell>{item.pendencia}</TableCell>
                        <TableCell>{formatarData(item.prazo)}</TableCell>
                        <TableCell className={item.vencida ? "text-right font-medium text-destructive" : "text-right"}>
                          {rotuloPrazo(item.dias)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        Nenhuma pendência no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </AppLayout>
  );
}

function Indicador({
  titulo,
  valor,
  icone: Icone,
  destaque = false,
  carregando,
}: {
  titulo: string;
  valor: number;
  icone: typeof UserRoundCheck;
  destaque?: boolean;
  carregando: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wide text-muted-foreground" title={titulo}>{titulo}</p>
          {carregando ? (
            <Skeleton className="mt-2 h-8 w-14" />
          ) : (
            <p className={`mt-1 text-3xl font-semibold tabular-nums ${destaque ? "text-destructive" : ""}`}>
              {valor}
            </p>
          )}
        </div>
        <div aria-hidden="true" className={`shrink-0 rounded-full p-3 ${destaque ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icone className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function GraficoCard({
  titulo,
  descricao,
  carregando = false,
  children,
}: {
  titulo: string;
  descricao: string;
  carregando?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </CardHeader>
      <CardContent>{carregando ? <Skeleton className="h-[260px] w-full sm:h-[300px]" /> : children}</CardContent>
    </Card>
  );
}

function SemDados() {
  return <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Nenhum afastamento ativo para exibir neste filtro.</div>;
}

function rotuloPrazo(dias: number) {
  if (dias < 0) return `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia vencido" : "dias vencidos"}`;
  if (dias === 0) return "Hoje";
  return `Em ${dias} ${dias === 1 ? "dia" : "dias"}`;
}
