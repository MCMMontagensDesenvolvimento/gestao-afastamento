import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChartNoAxesCombined, ClipboardList, Users, Settings } from "lucide-react";
import { Notificacoes } from "@/components/Notificacoes";
import logoMcm from "@/assets/Logo_MCM.png.asset.json";

const ITENS = [
  { to: "/dashboard", rotulo: "Dashboard", icone: ChartNoAxesCombined },
  { to: "/", rotulo: "Afastados", icone: ClipboardList },
  { to: "/colaboradores", rotulo: "Colaboradores", icone: Users },
  { to: "/configuracoes", rotulo: "Configurações", icone: Settings },
] as const;

export function AppLayout({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:block">
        <div className="border-b border-border px-5 py-5">
          <img src={logoMcm.url} alt="MCM" className="h-9 w-auto" />
          <p className="text-xs text-muted-foreground">Controle de Afastamentos</p>
        </div>
        <nav aria-label="Menu principal" className="flex flex-col gap-1 p-3">
          {ITENS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
            >
              <item.icone className="size-4" aria-hidden="true" />
              {item.rotulo}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <img src={logoMcm.url} alt="MCM" className="h-8 w-auto shrink-0 md:hidden" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-semibold tracking-tight">{titulo}</h1>
                {descricao ? (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{descricao}</p>
                ) : null}
              </div>
              <div className="shrink-0 sm:hidden"><Notificacoes /></div>
            </div>
            <div className="flex flex-wrap items-center gap-2 [&>*:not(.notif)]:flex-1 sm:[&>*:not(.notif)]:flex-none">
              <div className="notif hidden sm:block"><Notificacoes /></div>
              {acoes}
            </div>
          </div>
          <nav aria-label="Menu principal" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
            {ITENS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="shrink-0 whitespace-nowrap rounded-md border border-border px-3 py-2 text-xs"
                activeProps={{ className: "border-primary text-primary" }}
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
