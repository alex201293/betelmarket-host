"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import {
  Globe,
  Mail,
  HardDrive,
  Users,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { UsageData } from "@/types";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const { data: usage, isLoading } = useQuery<UsageData>({
    queryKey: ["usage"],
    queryFn: async () => {
      const { data } = await api.get("/usage");
      return data;
    },
  });

  const { data: domainsData } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data } = await api.get("/domains");
      return data;
    },
  });

  const domains = domainsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const diskPercentage =
    usage && usage.disk_limit_mb > 0
      ? Math.round((usage.disk_used_mb / usage.disk_limit_mb) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.dashboard.title}, {user?.name}! 👋
        </h1>
        <p className="mt-1 text-gray-500">{t.dashboard.subtitle}</p>
      </div>

      {/* Alert Banner */}
      {diskPercentage >= 80 ? (
        <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-red-800">
              El uso de disco está al {diskPercentage}% — considera actualizar tu plan.
            </p>
          </div>
          <a href="https://betelmarket.com/" target="_blank" rel="noopener noreferrer">
            <button className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
              Upgrade
            </button>
          </a>
        </div>
      ) : diskPercentage >= 60 ? (
        <div className="flex items-center justify-between rounded-xl border border-yellow-100 bg-yellow-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm font-medium text-yellow-800">
              Uso de disco al {diskPercentage}%. Mantén un ojo en tu almacenamiento.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-green-100 bg-green-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-green-800">
              Todos los sistemas operativos. Sin alertas pendientes.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Globe}
          label={t.dashboard.domains}
          value={usage?.domains ?? 0}
          color="blue"
        />
        <StatCard
          icon={Mail}
          label={t.dashboard.mailboxes}
          value={usage?.mailboxes ?? 0}
          color="purple"
        />
        <StatCard
          icon={HardDrive}
          label={t.dashboard.diskUsed}
          value={formatBytes(usage?.disk_used_mb ?? 0)}
          color="orange"
        />
        <StatCard
          icon={Users}
          label={t.dashboard.activeAccounts}
          value={usage?.active_accounts ?? 0}
          color="green"
        />
      </div>

      {/* Disk usage bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">{t.dashboard.diskUsage}</h3>
          <span className="text-xs text-gray-500">
            {formatBytes(usage?.disk_used_mb ?? 0)} / {formatBytes(usage?.disk_limit_mb ?? 0)}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              diskPercentage >= 90 ? "bg-red-500" : diskPercentage >= 70 ? "bg-yellow-500" : "bg-brand-500"
            )}
            style={{ width: `${Math.min(diskPercentage, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">{diskPercentage}% {t.common.used}</p>
      </div>

      {/* Domains / Sites list - Hostinger style */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t.dashboard.yourSites || "Your Sites"}</h2>
          <Link href="/dashboard/domains" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {domains.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <Globe className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No domains yet. Add your first domain to get started.</p>
              <Link href="/dashboard/domains">
                <button className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Add Domain
                </button>
              </Link>
            </div>
          ) : (
            domains.slice(0, 5).map((domain: any) => (
              <div
                key={domain.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Globe className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{domain.domain}</p>
                      <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-brand-600" />
                      </a>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      {domain.ssl_enabled && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> SSL
                        </span>
                      )}
                      <span className={domain.status === "active" ? "text-green-600" : "text-yellow-600"}>
                        {domain.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/domains/${domain.id}`}>
                    <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      Manage
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Server status */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.dashboard.serverStatus}</h3>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-600">{t.dashboard.operational}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
