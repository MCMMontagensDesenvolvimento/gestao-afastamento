import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead } from "@/services/notifications";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => getNotifications("all"),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    // Refresh on failure as well: the alert may no longer be applicable.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
