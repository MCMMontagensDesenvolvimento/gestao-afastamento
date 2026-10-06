import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Params } from "@/lib/api/types";
import {
  countLeavesByClassification,
  getLeave,
  listLeaves,
  saveLeave,
  type LeaveInput,
} from "@/services/leaves";

export const leavesPageQuery = (params: Params) =>
  queryOptions({ queryKey: ["leaves", "list", params], queryFn: () => listLeaves(params) });
export const afastamentoQuery = (id: string) =>
  queryOptions({ queryKey: ["leaves", "detail", id], queryFn: () => getLeave(id) });
export const leaveCountsQuery = () =>
  queryOptions({ queryKey: ["leaves", "counts"], queryFn: countLeavesByClassification });

export function useSaveLeave() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, id }: { input: LeaveInput; id?: string }) => saveLeave(input, id),
    onSuccess: async (item) => {
      client.setQueryData(afastamentoQuery(item.id).queryKey, item);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["leaves", "list"] }),
        client.invalidateQueries({ queryKey: ["leaves", "counts"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
        client.invalidateQueries({ queryKey: ["notifications"] }),
        client.invalidateQueries({ queryKey: ["employees", "history"] }),
      ]);
    },
  });
}
