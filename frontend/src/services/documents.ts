import { api, apiBlob } from "@/lib/api/client";

export interface LeaveDocument {
  id: string;
  afastamentoId: string;
  andamentoId: string | null;
  tipoDocumentoId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  tipoDocumento: { nome: string };
}
export interface DocumentInput {
  file: File;
  tipoDocumentoId: string;
  andamentoId?: string;
}

export async function listDocuments(leaveId: string) {
  return (await api<{ data: LeaveDocument[] }>(`/afastamentos/${leaveId}/documentos`)).data;
}
export async function uploadDocument(leaveId: string, input: DocumentInput) {
  const body = new FormData();
  body.append("file", input.file);
  body.append("tipoDocumentoId", input.tipoDocumentoId);
  if (input.andamentoId) body.append("andamentoId", input.andamentoId);
  return (
    await api<{ data: LeaveDocument }>(`/afastamentos/${leaveId}/documentos`, {
      method: "POST",
      body,
    })
  ).data;
}
export async function downloadDocument(item: LeaveDocument) {
  const blob = await apiBlob(`/documentos/${item.id}/download`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = item.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
export const deleteDocument = (id: string) => api<void>(`/documentos/${id}`, { method: "DELETE" });
