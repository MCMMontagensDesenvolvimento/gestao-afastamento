import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sessionQuery, useLogout } from "@/lib/auth/session";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { authService, safeReturnTo } from "@/services/auth";
import logoMcm from "@/assets/logo-mcm.png";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string; authError?: string } => ({
    ...(typeof search["returnTo"] === "string"
      ? { returnTo: safeReturnTo(search["returnTo"]) }
      : {}),
    ...(typeof search["authError"] === "string" ? { authError: search["authError"] } : {}),
  }),
  component: Login,
});

const authErrors: Record<string, string> = {
  IDENTITY_PROVIDER_NOT_CONFIGURED:
    "A autenticação Microsoft ainda não está disponível neste ambiente. Contate o administrador.",
  LOCAL_USER_NOT_AUTHORIZED:
    "Sua conta não está habilitada nesta aplicação. Solicite acesso ao administrador.",
  MICROSOFT_TENANT_NOT_ALLOWED: "Sua organização Microsoft não está autorizada nesta aplicação.",
  EMAIL_DOMAIN_NOT_ALLOWED: "Use sua conta corporativa MCM autorizada.",
  OIDC_FLOW_EXPIRED: "A tentativa de login expirou. Inicie novamente.",
};

function Login() {
  const search = Route.useSearch();
  const router = useRouter();
  const session = useQuery(sessionQuery());
  const logout = useLogout();
  const error = search.authError
    ? (authErrors[search.authError] ??
      "Não foi possível concluir a autenticação Microsoft. Tente novamente ou contate o administrador.")
    : session.error instanceof ApiError && session.error.status === 401
      ? null
      : session.error
        ? errorMessage(session.error)
        : null;
  const destination = session.data?.permissions.includes("leaves.read")
    ? "/"
    : session.data?.permissions.includes("dashboard.read")
      ? "/dashboard"
      : session.data?.permissions.includes("employees.read")
        ? "/colaboradores"
        : session.data?.permissions.includes("settings.manage")
          ? "/configuracoes"
          : session.data?.permissions.includes("users.read")
            ? "/usuarios"
            : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <section className="w-full max-w-md space-y-6 rounded-md border border-border bg-card p-6 sm:p-8">
        <img src={logoMcm} alt="MCM" className="h-10 w-auto" />
        <div>
          <h1 className="text-xl font-semibold">
            {import.meta.env["VITE_APP_NAME"] || "MCM Gestão de Afastados"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse com sua conta corporativa Microsoft.
          </p>
        </div>
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
          >
            {error}
          </div>
        ) : null}
        {session.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            Verificando sessão…
          </p>
        ) : session.data ? (
          <div className="space-y-3">
            <p className="text-sm">Conectado como {session.data.user.name}.</p>
            {destination ? (
              <Button asChild className="w-full">
                <a
                  href={search.returnTo ?? destination}
                  onClick={(event) => {
                    event.preventDefault();
                    void router.navigate({ href: search.returnTo ?? destination });
                  }}
                >
                  Acessar o sistema
                </a>
              </Button>
            ) : (
              <p role="alert" className="text-sm text-muted-foreground">
                Sua sessão está ativa, mas não há módulos autorizados. Solicite acesso ao
                administrador.
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Sair
            </Button>
            {logout.error ? (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(logout.error)}
              </p>
            ) : null}
          </div>
        ) : (
          <Button asChild className="w-full">
            <a href={authService.loginUrl(search.returnTo)}>
              <LogIn className="size-4" />
              Entrar com Microsoft
            </a>
          </Button>
        )}
        {session.error && !(session.error instanceof ApiError && session.error.status === 401) ? (
          <Button variant="outline" className="w-full" onClick={() => void session.refetch()}>
            Verificar novamente
          </Button>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Acesso para contas habilitadas dos domínios mcm.eng.br e mcmmontagens.com.br.
        </p>
      </section>
    </main>
  );
}
