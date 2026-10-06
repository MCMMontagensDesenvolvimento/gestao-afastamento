import { api } from "@/lib/api/client";

export interface DashboardData {
  indicators: {
    activeLeaves: number;
    expiredBenefits: number;
    expectedReturnsNext15Days: number;
  };
  activeByObra: Array<{ obraId: string; obraNome: string; total: number }>;
  newLeavesByMonth: Array<{ month: string; total: number }>;
  duration: { status: "pending_final_validation"; series: [] };
  priorities: Array<{
    type: "BENEFICIO" | "RETORNO";
    dueDate: string;
    isOverdue: boolean;
    afastamentoId: string;
    colaboradorId: string;
    colaboradorNome: string;
  }>;
}

export async function getDashboard() {
  const response = await api<{ data: DashboardData }>("/dashboard");
  return response.data;
}
