import { api } from "@/lib/api/client";
import type { Andamento } from "@/lib/dados";

interface ProgressDto {
  id: string;
  afastamentoId: string;
  tipoAndamentoId: string;
  dataAndamento: string;
  descricao: string;
  proximaAcao: string | null;
  dataProximaAcao: string | null;
  tipoAndamento: { nome: string };
}
export interface ProgressInput {
  tipoAndamentoId: string;
  dataAndamento: string;
  descricao: string;
  proximaAcao: string | null;
  dataProximaAcao: string | null;
}
const mapProgress = (item: ProgressDto): Andamento => ({
  id: item.id,
  afastamento_id: item.afastamentoId,
  tipo_andamento_id: item.tipoAndamentoId,
  data_andamento: item.dataAndamento,
  descricao: item.descricao,
  proxima_acao: item.proximaAcao,
  data_proxima_acao: item.dataProximaAcao,
  tipos_andamento_afastamento: item.tipoAndamento,
});

export async function listProgress(leaveId: string): Promise<Andamento[]> {
  const result = await api<{ data: ProgressDto[] }>(`/afastamentos/${leaveId}/andamentos`);
  return result.data.map(mapProgress);
}
export async function saveProgress(leaveId: string, input: ProgressInput, id?: string) {
  const result = await api<{ data: ProgressDto }>(
    id ? `/andamentos/${id}` : `/afastamentos/${leaveId}/andamentos`,
    {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(input),
    },
  );
  return mapProgress(result.data);
}
export const deleteProgress = (id: string) => api<void>(`/andamentos/${id}`, { method: "DELETE" });
