"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatBytes, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Backup } from "@/types";

export default function BackupsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [hostingAccountId, setHostingAccountId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const { data } = await api.get("/backups");
      return data;
    },
  });

  const createBackup = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/backups", {
        hosting_account_id: parseInt(hostingAccountId),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success(t.backups.createSuccess);
      setHostingAccountId("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t.backups.createError);
    },
  });

  const restoreBackup = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/backups/${id}/restore`);
    },
    onSuccess: () => {
      toast.success(t.backups.restoreSuccess);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t.backups.restoreError);
    },
  });

  const backups: Backup[] = data?.data || [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success" as const;
      case "failed": return "destructive" as const;
      case "in_progress": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.backups.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.backups.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t.backups.hostingAccountId}
            type="number"
            value={hostingAccountId}
            onChange={(e) => setHostingAccountId(e.target.value)}
            className="w-48"
          />
          <Button
            onClick={() => createBackup.mutate()}
            disabled={!hostingAccountId || createBackup.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createBackup.isPending ? t.backups.creating : t.backups.createBackup}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.backups.id}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.backups.date}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.backups.size}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.common.status}</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">
                        #{backup.id}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(backup.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {backup.size_mb > 0 ? formatBytes(backup.size_mb) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant(backup.status)}>
                          {backup.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {backup.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreBackup.mutate(backup.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            {t.backups.restore}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {backups.length === 0 && (
                <p className="py-8 text-center text-gray-500">{t.backups.noBackups}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
