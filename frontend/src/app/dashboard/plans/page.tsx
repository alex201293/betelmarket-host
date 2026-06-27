"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Plan } from "@/types";

export default function PlansPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", max_domains: "1", max_subdomains: "5", max_mailboxes: "10",
    disk_quota_mb: "5120", bandwidth_quota_mb: "51200", max_databases: "1", price: "9.99",
  });

  const { data, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/plans");
      return data;
    },
  });

  const createPlan = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        max_domains: parseInt(form.max_domains),
        max_subdomains: parseInt(form.max_subdomains),
        max_mailboxes: parseInt(form.max_mailboxes),
        disk_quota_mb: parseInt(form.disk_quota_mb),
        bandwidth_quota_mb: parseInt(form.bandwidth_quota_mb),
        max_databases: parseInt(form.max_databases),
        price: parseFloat(form.price),
      };
      const { data } = await api.post("/plans", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success(t.plans.createSuccess);
      setShowCreate(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t.plans.createError);
    },
  });

  const plans: Plan[] = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.plans.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.plans.subtitle}</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" /> {t.plans.createPlan}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); createPlan.mutate(); }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input placeholder={t.plans.planName} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder={t.plans.maxDomains} type="number" value={form.max_domains}
                onChange={(e) => setForm({ ...form, max_domains: e.target.value })} />
              <Input placeholder={t.plans.maxMailboxes} type="number" value={form.max_mailboxes}
                onChange={(e) => setForm({ ...form, max_mailboxes: e.target.value })} />
              <Input placeholder={t.plans.diskMb} type="number" value={form.disk_quota_mb}
                onChange={(e) => setForm({ ...form, disk_quota_mb: e.target.value })} />
              <Input placeholder={t.plans.bandwidthMb} type="number" value={form.bandwidth_quota_mb}
                onChange={(e) => setForm({ ...form, bandwidth_quota_mb: e.target.value })} />
              <Input placeholder={t.plans.maxDatabases} type="number" value={form.max_databases}
                onChange={(e) => setForm({ ...form, max_databases: e.target.value })} />
              <Input placeholder={t.plans.price} type="number" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? t.plans.creating : t.common.create}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : plans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-950">
                    <Package className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                </div>
                <span className="text-xl font-bold text-brand-600">${plan.price}/mo</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>{plan.max_domains} {t.plans.domains} • {plan.max_mailboxes} {t.plans.mailboxes}</p>
                <p>{formatBytes(plan.disk_quota_mb)} {t.plans.disk} • {formatBytes(plan.bandwidth_quota_mb)} {t.plans.bw}</p>
                <p>{plan.max_databases} {t.plans.databases} • {plan.max_subdomains} {t.plans.subdomains}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
