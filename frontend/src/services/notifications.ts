import { api, withParams } from "@/lib/api/client";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isOverdue: boolean;
  isRead: boolean;
  readAt: string | null;
  dueDate: string;
  context: { afastamentoId: string; colaboradorId: string };
}

// Notifications expose a derived feed and unreadCount, without pagination.
export interface NotificationsResponse {
  data: Notification[];
  meta: { unreadCount: number };
}

export function getNotifications(status: "all" | "unread" = "all") {
  return api<NotificationsResponse>(withParams("/notificacoes", { status }));
}

export async function markNotificationRead(id: string) {
  const response = await api<{ data: { id: string; isRead: true; readAt: string } }>(
    `/notificacoes/${encodeURIComponent(id)}/leitura`,
    { method: "PUT" },
  );
  return response.data;
}
