import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteProgress,
  listProgress,
  saveProgress,
  type ProgressInput,
} from "@/services/progress";

export const andamentosQuery = (leaveId: string) =>
  queryOptions({ queryKey: ["progress", leaveId], queryFn: () => listProgress(leaveId) });
export function useProgressMutations(leaveId: string) {
  const client = useQueryClient();
  const invalidate = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["progress", leaveId] }),
      client.invalidateQueries({ queryKey: ["notifications"] }),
      client.invalidateQueries({ queryKey: ["employees", "history"] }),
    ]);
  const save = useMutation({
    mutationFn: ({ input, id }: { input: ProgressInput; id?: string }) =>
      saveProgress(leaveId, input, id),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteProgress, onSuccess: invalidate });
  return { save, remove };
}
