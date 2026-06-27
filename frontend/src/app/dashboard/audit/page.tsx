"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface AuditEntry {
  id: number;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  ip_address: string | null;
  created_at: string;
  user?: { name: string; email: string };
}

export default function AuditPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await api.get("/audit-logs");
      return data;
    },
  });

  const logs: AuditEntry[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.audit.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t.audit.subtitle}
        </p>
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.audit.user}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.audit.action}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.audit.resource}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.audit.ip}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.audit.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {log.user?.name || t.audit.system}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {log.resource_type && `${log.resource_type} #${log.resource_id}`}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <p className="py-8 text-center text-gray-500">{t.audit.noLogs}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
