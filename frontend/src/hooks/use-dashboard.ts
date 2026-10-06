import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/services/dashboard";

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    enabled,
  });
}
