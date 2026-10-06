import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ApiError } from "@/lib/api/errors";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export function getRouter() {
  let expiring = false;
  const expireSession = () => {
    if (expiring) return;
    expiring = true;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    void queryClient
      .cancelQueries()
      .then(async () => {
        queryClient.clear();
        queryClient.setQueryData(queryKeys.auth, null);
        if (window.location.pathname !== "/login")
          await router.navigate({ to: "/login", search: { returnTo }, replace: true });
      })
      .finally(() => {
        expiring = false;
      });
  };
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (error instanceof ApiError && error.status === 401 && query.state.data !== undefined)
          expireSession();
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) =>
          count < 1 && (!(error instanceof ApiError) || error.status >= 500 || error.status === 0),
      },
      mutations: { retry: false },
    },
  });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
  setUnauthorizedHandler(expireSession);
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
