import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService, type Session } from "@/services/auth";
import { queryKeys } from "@/lib/query/keys";

export const sessionQuery = () =>
  queryOptions<Session | null>({
    queryKey: queryKeys.auth,
    queryFn: authService.me,
    staleTime: 60_000,
    retry: false,
  });

export function useAuth() {
  const session = useQuery(sessionQuery());
  return {
    ...session,
    user: session.data?.user ?? null,
    roles: session.data?.roles ?? [],
    permissions: session.data?.permissions ?? [],
    can: (permission: string) =>
      !session.isError && (session.data?.permissions.includes(permission) ?? false),
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await navigate({ to: "/login", replace: true });
    },
  });
}
