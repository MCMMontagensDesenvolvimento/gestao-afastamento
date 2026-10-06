import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  HeadContent,
  createRootRouteWithContext,
  redirect,
  type ErrorComponentProps,
  useRouter,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { TabelaSkeleton } from "@/components/padroes";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { sessionQuery } from "@/lib/auth/session";

function permissionFor(path: string) {
  if (path === "/") return "leaves.read";
  if (path === "/dashboard") return "dashboard.read";
  if (path === "/afastamentos/novo") return "leaves.create";
  if (/^\/afastamentos\/[^/]+\/editar\/?$/.test(path)) return "leaves.update";
  if (path.startsWith("/afastamentos/")) return "leaves.read";
  if (path.startsWith("/colaboradores")) return "employees.read";
  if (path === "/configuracoes") return "settings.manage";
  if (path === "/usuarios") return "users.read";
  return undefined;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi alterado.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const denied = error instanceof ApiError && error.status === 403;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-xl font-semibold">
          {denied ? "Acesso negado" : "Não foi possível carregar esta página"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage(error)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Voltar à entrada</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/login") return;
    try {
      const session = await context.queryClient.fetchQuery(sessionQuery());
      if (!session)
        throw redirect({ to: "/login", search: { returnTo: location.href }, replace: true });
      const permission = permissionFor(location.pathname);
      if (permission && !session.permissions.includes(permission)) {
        throw new ApiError(
          403,
          "PERMISSION_DENIED",
          "Você não possui permissão para acessar esta página. Solicite acesso ao administrador.",
        );
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        context.queryClient.clear();
        context.queryClient.setQueryData(sessionQuery().queryKey, null);
        throw redirect({ to: "/login", search: { returnTo: location.href }, replace: true });
      }
      throw error;
    }
  },
  component: RootComponent,
  pendingComponent: () => (
    <div className="mx-auto max-w-4xl p-6">
      <TabelaSkeleton />
    </div>
  ),
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <Outlet />
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
