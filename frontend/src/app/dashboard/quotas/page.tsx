"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  HardDrive, TrendingUp, Eye, EyeOff, Settings, ArrowUpCircle,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";

// Mock accounts with quota info
const mockAccounts = [
  { id: 1, user: "Juan Pérez", hestia_username: "bm_juan01", plan: "Business", visible_disk_mb: 51200, real_disk_mb: 2048, disk_used_mb: 1500, real_usage_percent: 73.2, auto_scale: true, needs_scaling: false },
  { id: 2, user: "María García", hestia_username: "bm_maria02", plan: "Starter", visible_disk_mb: 5120, real_disk_mb: 1024, disk_used_mb: 890, real_usage_percent: 86.9, auto_scale: true, needs_scaling: true },
  { id: 3, user: "Carlos López", hestia_username: "bm_carlos03", plan: "Enterprise", visible_disk_mb: 256000, real_disk_mb: 5120, disk_used_mb: 2100, real_usage_percent: 41.0, auto_scale: true, needs_scaling: false },
];

export default function QuotasPage() {
  const [selected, setSelected] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    real_disk_mb: "",
    real_max_mailboxes: "",
    real_mailbox_quota_mb: "",
    scale_threshold_percent: "80",
    scale_increment_mb: "1024",
    admin_notes: "",
  });

  const updateQuota = useMutation({
    mutationFn: async () => {
      await api.patch(`/quotas/${selected?.id}`, {
        real_disk_mb: parseInt(editForm.real_disk_mb),
        real_max_mailboxes: parseInt(editForm.real_max_mailboxes),
        real_mailbox_quota_mb: parseInt(editForm.real_mailbox_quota_mb),
        scale_threshold_percent: parseInt(editForm.scale_threshold_percent),
        scale_increment_mb: parseInt(editForm.scale_increment_mb),
        admin_notes: editForm.admin_notes,
      });
    },
    onSuccess: () => { toast.success("Quotas updated"); setSelected(null); },
  });

  const scaleUp = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/quotas/${id}/scale-up`);
    },
    onSuccess: () => toast.success("Account scaled up"),
  });

  const openEdit = (account: any) => {
    setSelected(account);
    setEditForm({
      real_disk_mb: String(account.real_disk_mb),
      real_max_mailboxes: "5",
      real_mailbox_quota_mb: "200",
      scale_threshold_percent: "80",
      scale_increment_mb: "1024",
      admin_notes: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quotas & Overprovisioning</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona cuotas reales vs visibles. El cliente ve el plan completo, pero internamente se asigna menos y se escala automáticamente.
        </p>
      </div>

      {/* How it works */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-brand-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cómo funciona el overprovisioning</h3>
              <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <Eye className="h-4 w-4 text-blue-500 mb-1" />
                  <p className="font-medium text-gray-900">Cliente ve</p>
                  <p>Plan de 5GB, 10 correos</p>
                </div>
                <div className="rounded-lg border p-3">
                  <EyeOff className="h-4 w-4 text-orange-500 mb-1" />
                  <p className="font-medium text-gray-900">Real asignado</p>
                  <p>2GB disco, 5 correos</p>
                </div>
                <div className="rounded-lg border p-3">
                  <ArrowUpCircle className="h-4 w-4 text-green-500 mb-1" />
                  <p className="font-medium text-gray-900">Auto-escala</p>
                  <p>Al 80% se agrega 1GB</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts table */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas de Hosting</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Plan</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Visible</span>
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">
                    <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Real</span>
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Uso Real</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Auto-Scale</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{account.user}</p>
                      <p className="text-xs text-gray-500 font-mono">{account.hestia_username}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">{account.plan}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatBytes(account.visible_disk_mb)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {formatBytes(account.real_disk_mb)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${account.real_usage_percent >= 80 ? "bg-red-500" : account.real_usage_percent >= 60 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(account.real_usage_percent, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${account.real_usage_percent >= 80 ? "text-red-600" : "text-gray-600"}`}>
                          {account.real_usage_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {account.auto_scale ? (
                        <Badge variant="success">On</Badge>
                      ) : (
                        <Badge variant="secondary">Off</Badge>
                      )}
                      {account.needs_scaling && (
                        <Badge variant="warning" className="ml-1">Needs scale</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {account.needs_scaling && (
                          <Button size="sm" variant="ghost" onClick={() => scaleUp.mutate(account.id)}>
                            <ArrowUpCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openEdit(account)}>
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit modal */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Editar cuotas — {selected.user} ({selected.hestia_username})</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); updateQuota.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Disco real (MB)</label>
                  <Input type="number" value={editForm.real_disk_mb} onChange={(e) => setEditForm({ ...editForm, real_disk_mb: e.target.value })} />
                  <p className="mt-1 text-xs text-gray-500">Cliente ve: {formatBytes(selected.visible_disk_mb)}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Max mailboxes real</label>
                  <Input type="number" value={editForm.real_max_mailboxes} onChange={(e) => setEditForm({ ...editForm, real_max_mailboxes: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Cuota por mailbox (MB)</label>
                  <Input type="number" value={editForm.real_mailbox_quota_mb} onChange={(e) => setEditForm({ ...editForm, real_mailbox_quota_mb: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Umbral auto-scale (%)</label>
                  <Input type="number" value={editForm.scale_threshold_percent} onChange={(e) => setEditForm({ ...editForm, scale_threshold_percent: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Incremento (MB)</label>
                  <Input type="number" value={editForm.scale_increment_mb} onChange={(e) => setEditForm({ ...editForm, scale_increment_mb: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas admin</label>
                  <Input value={editForm.admin_notes} onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })} placeholder="Notas internas..." />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateQuota.isPending}>
                  {updateQuota.isPending ? "Guardando..." : "Guardar cuotas"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
