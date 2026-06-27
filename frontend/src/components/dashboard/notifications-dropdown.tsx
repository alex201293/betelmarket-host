"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { Bell } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: string;
  read_at: string | null;
  created_at: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: countData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/unread-count");
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data;
    },
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const unreadCount = countData?.unread_count || 0;
  const notifications: Notification[] = notificationsData?.data || [];

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "border-l-red-500";
      case "warning": return "border-l-yellow-500";
      default: return "border-l-blue-500";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 p-3">
              <h3 className="text-sm font-semibold text-gray-900">{t.notifications.title}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {t.notifications.markAllRead}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">{t.notifications.empty}</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "border-b border-l-4 border-b-gray-50 p-3 last:border-b-0",
                      severityColor(n.severity),
                      !n.read_at && "bg-gray-50"
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
