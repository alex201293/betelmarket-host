"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Plus, Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Plan } from "@/types";

export default function PlansPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "", max_domains: "1", max_subdomains: "5", max_mailboxes: "10",
    disk_quota_mb: "5120", bandwidth_quota_mb: "51200", max_databases: "1", price: "9.99",
    mailbox_quota_mb: "1024",
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
        mailbox_quota_mb: parseInt(form.mailbox_quota_mb),
      };
      await api.post("/plans", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan created");
      setShowCreate(false);
      setForm({ name: "", max_domains: "1", max_subdomains: "5", max_mailboxes: "10", disk_quota_mb: "5120", bandwidth_quota_mb: "51200", max_databases: "1", price: "9.99" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updatePlan = useMutation({
    mutationFn: async () => {
      if (!editingPlan) return;
      await api.patch(`/plans/${editingPlan.id}`, {
        name: form.name,
        max_domains: parseInt(form.max_domains),
        max_subdomains: parseInt(form.max_subdomains),
        max_mailboxes: parseInt(form.max_mailboxes),
        disk_quota_mb: parseInt(form.disk_quota_mb),
        bandwidth_quota_mb: parseInt(form.bandwidth_quota_mb),
        max_databases: parseInt(form.max_databases),
        price: parseFloat(form.price),
        mailbox_quota_mb: parseInt(form.mailbox_quota_mb),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan updated");
      setEditingPlan(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setShowCreate(false);
    setForm({
      name: plan.name,
      max_domains: String(plan.max_domains),
      max_subdomains: String(plan.max_subdomains),
      max_mailboxes: String(plan.max_mailboxes),
      disk_quota_mb: String(plan.disk_quota_mb),
      bandwidth_quota_mb: String(plan.bandwidth_quota_mb),
      max_databases: String(plan.max_databases),
      price: String(plan.price),
      mailbox_quota_mb: String((plan as any).mailbox_quota_mb || 1024),
    });
  };

  const plans: Plan[] = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.plans.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.plans.subtitle}</p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setEditingPlan(null); }}>
          <Plus className="mr-2 h-4 w-4" /> {t.plans.createPlan}
        </Button>
      </div>

      {/* Create / Edit form */}
      {(showCreate || editingPlan) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create New Plan"}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); editingPlan ? updatePlan.mutate() : createPlan.mutate(); }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Max Domains</label>
                <Input type="number" value={form.max_domains} onChange={(e) => setForm({ ...form, max_domains: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Max Subdomains</label>
                <Input type="number" value={form.max_subdomains} onChange={(e) => setForm({ ...form, max_subdomains: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Max Mailboxes</label>
                <Input type="number" value={form.max_mailboxes} onChange={(e) => setForm({ ...form, max_mailboxes: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Disk (MB)</label>
                <Input type="number" value={form.disk_quota_mb} onChange={(e) => setForm({ ...form, disk_quota_mb: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Bandwidth (MB)</label>
                <Input type="number" value={form.bandwidth_quota_mb} onChange={(e) => setForm({ ...form, bandwidth_quota_mb: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Max Databases</label>
                <Input type="number" value={form.max_databases} onChange={(e) => setForm({ ...form, max_databases: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mailbox Quota (MB)</label>
                <Input type="number" value={form.mailbox_quota_mb} onChange={(e) => setForm({ ...form, mailbox_quota_mb: e.target.value })} />
                <p className="text-[10px] text-gray-400 mt-0.5">500=500MB, 1024=1GB, 5120=5GB</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Price ($/mo)</label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </form>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => editingPlan ? updatePlan.mutate() : createPlan.mutate()} disabled={createPlan.isPending || updatePlan.isPending}>
                <Save className="mr-1 h-4 w-4" />
                {editingPlan ? "Save Changes" : "Create Plan"}
              </Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditingPlan(null); }}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans grid */}
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
                  <div className="rounded-lg bg-brand-50 p-2">
                    <Package className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                </div>
                <span className="text-xl font-bold text-brand-600">${plan.price}/mo</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{plan.max_domains} domains • {plan.max_mailboxes} mailboxes</p>
                <p>{formatBytes(plan.disk_quota_mb)} disk • {formatBytes(plan.bandwidth_quota_mb)} BW</p>
                <p>{plan.max_databases} databases • {plan.max_subdomains} subdomains</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => startEdit(plan)}>
                  <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
