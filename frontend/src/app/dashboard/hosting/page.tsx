"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Server, User, Package, ArrowUpCircle, Pause, Play, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

interface HostingAccount {
  id: number;
  hestia_username: string;
  status: string;
  disk_used_mb: number;
  disk_limit_mb: number;
  real_disk_mb?: number;
  extra_mailboxes?: number;
  extra_domains?: number;
  extra_disk_mb?: number;
  user?: { id: number; name: string; email: string };
  plan?: { id: number; name: string; price: string; disk_quota_mb: number };
}

export default function HostingPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editAccount, setEditAccount] = useState<HostingAccount | null>(null);
  const [form, setForm] = useState({ user_id: "", plan_id: "" });
  const [upgradePlanId, setUpgradePlanId] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["hosting"],
    queryFn: async () => { const { data } = await api.get("/hosting"); return data; },
  });

  const { data: users } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => { const { data } = await api.get("/users"); return data; },
  });

  const { data: plans } = useQuery({
    queryKey: ["plans-list"],
    queryFn: async () => { const { data } = await api.get("/plans"); return data; },
  });

  const createAccount = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/hosting", { user_id: parseInt(form.user_id), plan_id: parseInt(form.plan_id) });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosting"] });
      toast.success("Hosting account created. Provisioning in HestiaCP...");
      setShowCreate(false);
      setForm({ user_id: "", plan_id: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const changePlan = useMutation({
    mutationFn: async () => {
      if (!editAccount) return;
      await api.patch(`/hosting/${editAccount.id}`, { plan_id: parseInt(upgradePlanId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosting"] });
      toast.success("Plan changed successfully");
      setEditAccount(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to change plan"),
  });

  const suspendAccount = useMutation({
    mutationFn: async (id: number) => { await api.patch(`/hosting/${id}`, { status: "suspended" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hosting"] }); toast.success("Account suspended"); },
  });

  const activateAccount = useMutation({
    mutationFn: async (id: number) => { await api.patch(`/hosting/${id}`, { status: "active" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["hosting"] }); toast.success("Account activated"); },
  });

  const hostingList: HostingAccount[] = accounts?.data || [];
  const usersList = users?.data || [];
  const plansList = plans || [];

  const loginAsClient = async (account: HostingAccount) => {
    try {
      const { data } = await api.post(`/hosting/${account.id}/login-as`);
      // Save admin token, set client token, redirect
      localStorage.setItem("admin_token", localStorage.getItem("token") || "");
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error("Failed to login as client");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hosting Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Assign clients to plans, upgrade, suspend, or manage resources.</p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setEditAccount(null); }}>
          <Plus className="mr-2 h-4 w-4" /> Create Account
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Assign Plan to Client</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createAccount.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Client</label>
                  <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
                    <option value="">Select client...</option>
                    {usersList.map((u: any) => (<option key={u.id} value={u.id}>{u.name} ({u.email})</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan</label>
                  <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} required>
                    <option value="">Select plan...</option>
                    {plansList.map((p: any) => (<option key={p.id} value={p.id}>{p.name} — ${p.price}/mo ({formatBytes(p.disk_quota_mb)})</option>))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createAccount.isPending}>{createAccount.isPending ? "Creating..." : "Create Hosting Account"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Change Plan form */}
      {editAccount && (
        <Card>
          <CardHeader><CardTitle>Manage — {editAccount.user?.name} ({editAccount.hestia_username})</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Change plan */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Change Plan</h4>
              <p className="text-sm text-gray-600 mb-3">Current: <strong>{editAccount.plan?.name}</strong> (${editAccount.plan?.price}/mo)</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={upgradePlanId} onChange={(e) => setUpgradePlanId(e.target.value)}>
                    <option value="">Select new plan...</option>
                    {plansList.filter((p: any) => p.id !== editAccount.plan?.id).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} — ${p.price}/mo ({formatBytes(p.disk_quota_mb)})</option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => changePlan.mutate()} disabled={!upgradePlanId || changePlan.isPending}>
                  <ArrowUpCircle className="mr-1 h-4 w-4" /> {changePlan.isPending ? "Changing..." : "Change Plan"}
                </Button>
              </div>
            </div>

            {/* Extras */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Custom Extras (add without changing plan)</h4>
              <p className="text-xs text-gray-500 mb-3">Add extra resources to this specific client beyond their plan limits.</p>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Extra Mailboxes</label>
                  <Input type="number" placeholder="0" id="extra_mailboxes" defaultValue={editAccount.extra_mailboxes || 0} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mailbox Quota (MB each)</label>
                  <Input type="number" placeholder="500" id="real_mailbox_quota_mb" defaultValue={(editAccount as any).real_mailbox_quota_mb || 500} />
                  <p className="text-[10px] text-gray-400 mt-0.5">Size per mailbox (ej: 500 = 500MB, 5000 = 5GB)</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Extra Domains</label>
                  <Input type="number" placeholder="0" id="extra_domains" defaultValue={editAccount.extra_domains || 0} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Extra Disk (MB)</label>
                  <Input type="number" placeholder="0" id="extra_disk_mb" defaultValue={editAccount.extra_disk_mb || 0} />
                </div>
              </div>
              <Button className="mt-3" variant="outline" onClick={() => {
                const extras = {
                  extra_mailboxes: parseInt((document.getElementById("extra_mailboxes") as HTMLInputElement)?.value || "0"),
                  extra_domains: parseInt((document.getElementById("extra_domains") as HTMLInputElement)?.value || "0"),
                  extra_disk_mb: parseInt((document.getElementById("extra_disk_mb") as HTMLInputElement)?.value || "0"),
                  real_mailbox_quota_mb: parseInt((document.getElementById("real_mailbox_quota_mb") as HTMLInputElement)?.value || "500"),
                };
                api.patch(`/hosting/${editAccount.id}`, extras).then(() => {
                  queryClient.invalidateQueries({ queryKey: ["hosting"] });
                  toast.success("Extras updated");
                });
              }}>
                Save Extras
              </Button>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <Button variant="outline" onClick={() => setEditAccount(null)}>Close</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Client</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Plan</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Hestia User</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Disk</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hostingList.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{account.user?.name || "—"}</p>
                        <p className="text-xs text-gray-500">{account.user?.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="default">{account.plan?.name || "—"}</Badge>
                        <span className="ml-1 text-xs text-gray-500">${account.plan?.price}/mo</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{account.hestia_username}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${account.disk_limit_mb > 0 ? Math.min((account.disk_used_mb / account.disk_limit_mb) * 100, 100) : 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{formatBytes(account.disk_used_mb)} / {formatBytes(account.disk_limit_mb)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={account.status === "active" ? "success" : account.status === "pending" ? "warning" : "destructive"}>{account.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Login as client" onClick={() => loginAsClient(account)}>
                            <User className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Change Plan" onClick={() => { setEditAccount(account); setShowCreate(false); setUpgradePlanId(""); }}>
                            <ArrowUpCircle className="h-3.5 w-3.5 text-brand-600" />
                          </Button>
                          {account.status === "active" ? (
                            <Button size="sm" variant="ghost" title="Suspend" onClick={() => suspendAccount.mutate(account.id)}>
                              <Pause className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          ) : account.status === "suspended" ? (
                            <Button size="sm" variant="ghost" title="Activate" onClick={() => activateAccount.mutate(account.id)}>
                              <Play className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hostingList.length === 0 && (<p className="py-8 text-center text-sm text-gray-500">No hosting accounts yet.</p>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
