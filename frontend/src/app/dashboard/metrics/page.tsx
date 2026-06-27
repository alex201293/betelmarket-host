"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, MemoryStick, HardDrive, Activity, Clock, Globe, Mail, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ServerMetric {
  cpu_usage: number;
  ram_usage: number;
  ram_total_mb: number;
  ram_used_mb: number;
  disk_usage: number;
  disk_total_gb: number;
  disk_used_gb: number;
  load_average_1: number;
  load_average_5: number;
  load_average_15: number;
  total_domains: number;
  total_mail_accounts: number;
  total_users: number;
  uptime_hours: number;
}

export default function MetricsPage() {
  const { t } = useTranslation();

  const { data: metrics, isLoading } = useQuery<ServerMetric>({
    queryKey: ["metrics-current"],
    queryFn: async () => {
      const { data } = await api.get("/metrics/current");
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const uptimeDays = metrics ? Math.floor(metrics.uptime_hours / 24) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.metrics.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.metrics.subtitle}</p>
      </div>

      {/* Main gauges */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GaugeCard icon={Cpu} title={t.metrics.cpu} value={metrics?.cpu_usage || 0} unit="%" />
        <GaugeCard icon={MemoryStick} title={t.metrics.ram} value={metrics?.ram_usage || 0} unit="%" subtitle={`${(metrics?.ram_used_mb || 0).toFixed(0)} / ${(metrics?.ram_total_mb || 0).toFixed(0)} MB`} />
        <GaugeCard icon={HardDrive} title={t.metrics.disk} value={metrics?.disk_usage || 0} unit="%" subtitle={`${metrics?.disk_used_gb || 0} / ${metrics?.disk_total_gb || 0} GB`} />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-950">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-gray-500">{t.metrics.loadAverage}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                1m: <span className="font-mono font-semibold text-gray-900 dark:text-white">{metrics?.load_average_1?.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                5m: <span className="font-mono font-semibold text-gray-900 dark:text-white">{metrics?.load_average_5?.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                15m: <span className="font-mono font-semibold text-gray-900 dark:text-white">{metrics?.load_average_15?.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Globe} title={t.metrics.totalDomains} value={metrics?.total_domains || 0} color="blue" />
        <StatCard icon={Mail} title={t.metrics.mailAccounts} value={metrics?.total_mail_accounts || 0} color="purple" />
        <StatCard icon={Users} title={t.metrics.activeUsers} value={metrics?.total_users || 0} color="green" />
        <StatCard icon={Clock} title={t.metrics.uptime} value={`${uptimeDays}d`} color="orange" />
      </div>

      {/* Server Status */}
      <Card>
        <CardHeader>
          <CardTitle>{t.metrics.systemHealth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.metrics.webServer}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.metrics.database}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.metrics.mailServer}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GaugeCard({ icon: Icon, title, value, unit, subtitle }: { icon: any; title: string; value: number; unit: string; subtitle?: string }) {
  const color = value >= 90 ? "text-red-500" : value >= 70 ? "text-yellow-500" : "text-green-500";
  const bg = value >= 90 ? "bg-red-50 dark:bg-red-950" : value >= 70 ? "bg-yellow-50 dark:bg-yellow-950" : "bg-green-50 dark:bg-green-950";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`rounded-lg p-2 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <p className={`text-3xl font-bold ${color}`}>
          {value.toFixed(1)}{unit}
        </p>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className={`h-full rounded-full transition-all ${value >= 90 ? "bg-red-500" : value >= 70 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: number | string; color: string }) {
  const colorMap: Record<string, { text: string; bg: string }> = {
    blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
    purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950" },
    green: { text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950" },
    orange: { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${c.bg}`}>
            <Icon className={`h-5 w-5 ${c.text}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
