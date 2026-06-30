"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Plus, Trash2, Key, Copy, ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { PasswordInput } from "@/components/ui/password-input";
import type { MailAccount } from "@/types";

export default function MailPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [changePass, setChangePass] = useState<{ id: number; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ domain_id: "", account: "", password: "", quota_mb: "500" });

  const { data, isLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: async () => { const { data } = await api.get("/emails"); return data; },
  });

  const { data: domainsData } = useQuery({
    queryKey: ["domains-for-mail"],
    queryFn: async () => { const { data } = await api.get("/domains"); return data; },
  });

  const domainsList = (domainsData?.data || []).filter((d: any) => d.status === "active" && !d.is_temporary);
  const emails: MailAccount[] = data?.data || [];

  const webmailDomain = domainsList.length > 0 ? domainsList[0].domain : "";

  const createMail = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/emails", {
        domain_id: parseInt(form.domain_id), account: form.account,
        password: form.password, quota_mb: parseInt(form.quota_mb),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      toast.success("Mailbox created");
      setShowCreate(false);
      setForm({ domain_id: "", account: "", password: "", quota_mb: "500" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updatePassword = useMutation({
    mutationFn: async () => { if (!changePass) return; await api.patch("/emails/" + changePass.id, { password: newPassword }); },
    onSuccess: () => { toast.success("Password updated"); setChangePass(null); setNewPassword(""); },
    onError: () => toast.error("Failed"),
  });

  const deleteMail = useMutation({
    mutationFn: async (id: number) => { await api.delete("/emails/" + id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["emails"] }); toast.success("Deleted"); },
  });

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };
  const getDomain = (email: string) => email.split("@")[1] || "domain.com";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage mailboxes, passwords, and access webmail.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}><Plus className="mr-2 h-4 w-4" /> Create Mailbox</Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create New Mailbox</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createMail.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Domain</label>
                  <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })} required>
                    <option value="">Select domain...</option>
                    {domainsList.map((d: any) => (<option key={d.id} value={d.id}>{d.domain}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Account name</label>
                  <Input placeholder="info, admin, ventas..." value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <PasswordInput placeholder="Min 8 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Quota (MB)</label>
                  <Input type="number" value={form.quota_mb} onChange={(e) => setForm({ ...form, quota_mb: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMail.isPending}>{createMail.isPending ? "Creating..." : "Create Mailbox"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Change password */}
      {changePass && (
        <Card><CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Change password - {changePass.email}</h3>
          <div className="flex gap-2">
            <PasswordInput placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="max-w-xs" />
            <Button onClick={() => updatePassword.mutate()} disabled={!newPassword || newPassword.length < 8}>Change</Button>
            <Button variant="outline" onClick={() => { setChangePass(null); setNewPassword(""); }}>Cancel</Button>
          </div>
        </CardContent></Card>
      )}

      {/* Config panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mail Configuration - {showConfig}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Incoming (IMAP)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Server:</span><code className="bg-gray-100 px-2 rounded text-xs">mail.{getDomain(showConfig)}</code></div>
                  <div className="flex justify-between"><span className="text-gray-500">Port:</span><code className="bg-gray-100 px-2 rounded text-xs">993</code></div>
                  <div className="flex justify-between"><span className="text-gray-500">Security:</span><code className="bg-gray-100 px-2 rounded text-xs">SSL/TLS</code></div>
                  <div className="flex justify-between"><span className="text-gray-500">Username:</span><code className="bg-gray-100 px-2 rounded text-xs">{showConfig}</code></div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Outgoing (SMTP)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Server:</span><code className="bg-gray-100 px-2 rounded text-xs">mail.{getDomain(showConfig)}</code></div>
                  <div className="flex justify-between"><span className="text-gray-500">Port:</span><code className="bg-gray-100 px-2 rounded text-xs">465</code></div>
                  <div className="flex justify-between"><span className="text-gray-500">Security:</span><code className="bg-gray-100 px-2 rounded text-xs">SSL/TLS</code></div>
                  <div className="flex justify-between"><span className="text-gray-500">Username:</span><code className="bg-gray-100 px-2 rounded text-xs">{showConfig}</code></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email list - Hostinger style */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" /></div>
          ) : emails.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No mail accounts yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {emails.map((mail) => {
                const usagePercent = mail.quota_mb > 0 ? Math.round((mail.usage_mb / mail.quota_mb) * 100) : 0;
                const domain = mail.email.split("@")[1] || "";
                const quotaDisplay = mail.quota_mb >= 1024 ? (mail.quota_mb / 1024).toFixed(2) + " GB" : mail.quota_mb + " MB";
                const usageDisplay = mail.usage_mb >= 1024 ? (mail.usage_mb / 1024).toFixed(2) + " GB" : mail.usage_mb + " MB";
                return (
                  <div key={mail.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                    {/* Email + copy */}
                    <div className="flex items-center gap-2 min-w-[250px]">
                      <span className="font-medium text-gray-900">{mail.email}</span>
                      <button onClick={() => copyText(mail.email)} className="text-gray-400 hover:text-brand-600"><Copy className="h-3.5 w-3.5" /></button>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">{mail.status === "active" ? "Activo" : mail.status}</span>
                    </div>

                    {/* Usage */}
                    <div className="text-right text-sm">
                      <p className="font-medium text-gray-900">{usagePercent}% Usado</p>
                      <p className="text-xs text-gray-500">{usageDisplay} / {quotaDisplay}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <a href={`http://webmail.${domain}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">Webmail <ExternalLink className="ml-1 h-3 w-3" /></Button>
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => setShowConfig(mail.email)} title="Config"><Settings className="h-4 w-4 text-gray-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setChangePass({ id: mail.id, email: mail.email })} title="Password"><Key className="h-4 w-4 text-gray-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMail.mutate(mail.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
