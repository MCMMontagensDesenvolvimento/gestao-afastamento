import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  downloadDocument,
  listDocuments,
  uploadDocument,
  type DocumentInput,
} from "@/services/documents";

export const documentosQuery = (leaveId: string) =>
  queryOptions({ queryKey: ["documents", leaveId], queryFn: () => listDocuments(leaveId) });
export function useDocumentMutations(leaveId: string) {
  const client = useQueryClient();
  const invalidate = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["documents", leaveId] }),
      client.invalidateQueries({ queryKey: ["employees", "history"] }),
    ]);
  const upload = useMutation({
    mutationFn: (input: DocumentInput) => uploadDocument(leaveId, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteDocument, onSuccess: invalidate });
  const download = useMutation({ mutationFn: downloadDocument });
  return { upload, remove, download };
}
