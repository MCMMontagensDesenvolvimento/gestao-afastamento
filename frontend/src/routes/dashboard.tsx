import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarCheck, UserRoundCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoErro, EstadoVazio } from "@/components/padroes";
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
import { formatarData } from "@/lib/dados";
import { useAuth } from "@/lib/auth/session";
import { useDashboard } from "@/hooks/use-dashboard";
import { ApiError, errorMessage } from "@/lib/api/errors";

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

function Dashboard() {
  const { can } = useAuth();
  const { data, isLoading, isError, isFetching, error, refetch } = useDashboard(
    can("dashboard.read"),
  );
  const porObra =
    data?.activeByObra.map((item) => ({ obra: item.obraNome, quantidade: item.total })) ?? [];
  const porMes =
    data?.newLeavesByMonth.map((item) => {
      const [ano, mes] = item.month.split("-");
      return { mes: `${MESES[Number(mes) - 1] ?? mes}/${ano?.slice(-2)}`, quantidade: item.total };
    }) ?? [];

  return (
    <AppLayout
      titulo="Dashboard"
      descricao="Visão operacional dos afastamentos e prazos que exigem atenção."
      acoes={
        <div className="space-y-1">
          <Select value={TODOS} disabled>
            <SelectTrigger
              className="w-full bg-card sm:w-52"
              aria-label="Todas as obras"
              aria-describedby="dashboard-obra-indisponivel"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as obras</SelectItem>
            </SelectContent>
          </Select>
          <p id="dashboard-obra-indisponivel" className="text-xs text-muted-foreground">
            Filtro por obra indisponível nesta versão.
          </p>
        </div>
      }
    >
      {!can("dashboard.read") || (error instanceof ApiError && error.status === 403) ? (
        <EstadoVazio
          titulo="Acesso negado"
          descricao="Você não tem permissão para consultar o dashboard."
        />
      ) : isError ? (
        <EstadoErro mensagem={errorMessage(error)} aoTentarNovamente={() => void refetch()} />
      ) : (
        <>
          {isFetching && !isLoading ? (
            <p className="mb-3 text-sm text-muted-foreground" role="status">
              Atualizando indicadores...
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Indicador
              titulo="Afastamentos ativos"
              valor={data?.indicators.activeLeaves ?? 0}
              icone={UserRoundCheck}
              carregando={isLoading}
            />
            <Indicador
              titulo="Benefícios vencidos"
              valor={data?.indicators.expiredBenefits ?? 0}
              icone={AlertTriangle}
              destaque={(data?.indicators.expiredBenefits ?? 0) > 0}
              carregando={isLoading}
            />
            <Indicador
              titulo="Retornos previstos em 15 dias"
              valor={data?.indicators.expectedReturnsNext15Days ?? 0}
              icone={CalendarCheck}
              carregando={isLoading}
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <GraficoCard
              carregando={isLoading}
              titulo="Afastamentos ativos por obra"
              descricao="Distribuição atual por local de trabalho."
            >
              {porObra.length ? (
                <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[300px]">
                  <BarChart data={porObra} layout="vertical" margin={{ left: 12, right: 20 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      dataKey="obra"
                      type="category"
                      width={110}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="quantidade"
                      fill="var(--color-quantidade)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <SemDados />
              )}
            </GraficoCard>

            <GraficoCard
              carregando={isLoading}
              titulo="Novos afastamentos por mês"
              descricao="Registros agrupados por mês de afastamento."
            >
              {porMes.length ? (
                <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[300px]">
                  <LineChart data={porMes} margin={{ left: 4, right: 16 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="mes"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      minTickGap={8}
                    />
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
              ) : (
                <SemDados mensagem="Nenhum afastamento para exibir por mês." />
              )}
            </GraficoCard>

            <GraficoCard
              carregando={isLoading}
              titulo="Duração dos afastamentos"
              descricao="Quantidade de afastamentos por duração em dias."
            >
              {data?.duration.status === "available" && data.duration.distribution.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[300px]">
                  <BarChart
                    data={data.duration.distribution}
                    margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="total"
                      name="Afastamentos"
                      fill="var(--color-quantidade)"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center sm:h-[300px]">
                  <CalendarCheck className="size-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum afastamento com duração válida encontrado.
                  </p>
                </div>
              )}

              {data?.duration.status === "available" && (
                <div className="mt-3 border-t pt-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Duração média:{" "}
                    <strong className="text-foreground">
                      {data.duration.averageDays.toLocaleString("pt-BR")} dias
                    </strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.duration.totalLeaves} afastamentos considerados
                  </p>
                </div>
              )}
            </GraficoCard>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Pendências prioritárias</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Benefícios e retornos vencidos ou próximos.
                </p>
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
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Skeleton className="my-3 h-24 w-full" />
                          </TableCell>
                        </TableRow>
                      ) : data?.priorities.length ? (
                        data.priorities.map((item) => (
                          <TableRow key={`${item.type}-${item.afastamentoId}-${item.dueDate}`}>
                            <TableCell>
                              {can("leaves.read") ? (
                                <Link
                                  to="/afastamentos/$id"
                                  params={{ id: item.afastamentoId }}
                                  className="font-medium hover:text-primary hover:underline"
                                >
                                  {item.colaboradorNome}
                                </Link>
                              ) : (
                                <span className="font-medium">{item.colaboradorNome}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.type === "BENEFICIO"
                                ? item.isOverdue
                                  ? "Benefício vencido"
                                  : "Benefício próximo do vencimento"
                                : item.isOverdue
                                  ? "Retorno previsto vencido"
                                  : "Retorno previsto"}
                            </TableCell>
                            <TableCell>{formatarData(item.dueDate)}</TableCell>
                            <TableCell
                              className={
                                item.isOverdue
                                  ? "text-right font-medium text-destructive"
                                  : "text-right"
                              }
                            >
                              {item.isOverdue ? "Vencido" : "No prazo"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-10 text-center text-muted-foreground"
                          >
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
          <p
            className="truncate text-xs uppercase tracking-wide text-muted-foreground"
            title={titulo}
          >
            {titulo}
          </p>
          {carregando ? (
            <Skeleton className="mt-2 h-8 w-14" />
          ) : (
            <p
              className={`mt-1 text-3xl font-semibold tabular-nums ${destaque ? "text-destructive" : ""}`}
            >
              {valor}
            </p>
          )}
        </div>
        <div
          aria-hidden="true"
          className={`shrink-0 rounded-full p-3 ${destaque ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
        >
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
      <CardContent>
        {carregando ? <Skeleton className="h-[260px] w-full sm:h-[300px]" /> : children}
      </CardContent>
    </Card>
  );
}

function SemDados({ mensagem = "Nenhum afastamento ativo para exibir." }: { mensagem?: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      {mensagem}
    </div>
  );
}
