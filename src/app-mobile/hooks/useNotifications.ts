import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseExt } from "@/lib/supabaseExternal";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabaseExt
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery<{ count: number }>({
    queryKey: ["unread-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return { count: 0 };
      const { data, error } = await supabaseExt.rpc("get_unread_notification_count");
      if (error) throw error;
      return { count: Number(data ?? 0) };
    },
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabaseExt.rpc("mark_notification_read", {
        p_notification_id: notificationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabaseExt.rpc("mark_all_notifications_read");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}
