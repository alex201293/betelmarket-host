"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Mail, Plus, Trash2, Key, Copy, ExternalLink, Settings, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { MailAccount } from "@/types";

export default function MailPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showConfig, setShowConfig] = useState<string | null>(null);
  const [changePass, setChangePass] = useState<{ id: number; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ domain_id: "1", account: "", password: "", quota_mb: "500" });

  const { data, isLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: async () => {
      const { data } = await api.get("/emails");
      return data;
    },
  });

  const createMail = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/emails", {
        domain_id: parseInt(form.domain_id),
        account: form.account,
        password: form.password,
        quota_mb: parseInt(form.quota_mb),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      toast.success("Mailbox created successfully");
      setShowCreate(false);
      setForm({ domain_id: "1", account: "", password: "", quota_mb: "500" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updatePassword = useMutation({
    mutationFn: async () => {
      if (!changePass) return;
      await api.patch(`/emails/${changePass.id}`, { password: newPassword });
    },
    onSuccess: () => {
      toast.success("Password updated");
      setChangePass(null);
      setNewPassword("");
    },
    onError: () => toast.error("Failed to change password"),
  });

  const deleteMail = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/emails/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["emails"] }); toast.success("Mailbox deleted"); },
  });

  const emails: MailAccount[] = data?.data || [];

  const serverHost = "mail.tuservidor.com"; // In production: from config/domain

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  // Get domain from email
  const getDomain = (email: string) => email.split("@")[1] || "tudominio.com";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage mailboxes, passwords, and access webmail.</p>
        </div>
        <div className="flex gap-2">
          <a href={`https://${serverHost}/webmail`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" /> Webmail (Roundcube)
            </Button>
          </a>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" /> Create Mailbox
          </Button>
        </div>
      </div>

      {/* Webmail + Config Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Webmail Access</h3>
                <p className="mt-1 text-sm text-gray-600">Access email from any browser using Roundcube.</p>
                <a href={`https://${serverHost}/webmail`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                  Open Webmail <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-50 p-2.5">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mail Client Config</h3>
                <p className="mt-1 text-sm text-gray-600">Click the ⚙ icon on any account to see IMAP/SMTP settings.</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <Input placeholder="Domain ID" type="number" value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Account name</label>
                  <Input placeholder="info, admin, ventas..." value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <Input type="password" placeholder="Min 8 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
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

      {/* Change password card */}
      {changePass && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Change password — {changePass.email}</h3>
            <div className="flex gap-2">
              <Input type="password" placeholder="New password (min 8 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="max-w-xs" />
              <Button onClick={() => updatePassword.mutate()} disabled={!newPassword || newPassword.length < 8}>Change</Button>
              <Button variant="outline" onClick={() => { setChangePass(null); setNewPassword(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mail config panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mail Configuration — {showConfig}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(null)}>✕ Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Incoming */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📥 Incoming Mail (IMAP)</h4>
                <div className="space-y-2 text-sm">
                  <ConfigRow label="Server" value={`mail.${getDomain(showConfig)}`} onCopy={copyText} />
                  <ConfigRow label="Port" value="993" onCopy={copyText} />
                  <ConfigRow label="Security" value="SSL/TLS" />
                  <ConfigRow label="Username" value={showConfig} onCopy={copyText} />
                  <ConfigRow label="Password" value="(your mailbox password)" />
                </div>
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-semibold text-gray-900 mb-2">📥 POP3 (alternative)</h4>
                  <div className="space-y-2 text-sm">
                    <ConfigRow label="Server" value={`mail.${getDomain(showConfig)}`} onCopy={copyText} />
                    <ConfigRow label="Port" value="995" onCopy={copyText} />
                    <ConfigRow label="Security" value="SSL/TLS" />
                  </div>
                </div>
              </div>

              {/* Outgoing */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📤 Outgoing Mail (SMTP)</h4>
                <div className="space-y-2 text-sm">
                  <ConfigRow label="Server" value={`mail.${getDomain(showConfig)}`} onCopy={copyText} />
                  <ConfigRow label="Port" value="465" onCopy={copyText} />
                  <ConfigRow label="Security" value="SSL/TLS" />
                  <ConfigRow label="Username" value={showConfig} onCopy={copyText} />
                  <ConfigRow label="Password" value="(your mailbox password)" />
                  <ConfigRow label="Authentication" value="Required (same as incoming)" />
                </div>
                <div className="mt-3 border-t pt-3">
                  <h4 className="font-semibold text-gray-900 mb-2">📤 SMTP (alternative port)</h4>
                  <div className="space-y-2 text-sm">
                    <ConfigRow label="Port" value="587" onCopy={copyText} />
                    <ConfigRow label="Security" value="STARTTLS" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <strong>Tip:</strong> Use these settings in Outlook, Thunderbird, Apple Mail, Gmail (Accounts), or any mail app.
              For webmail access, use Roundcube at <code className="bg-blue-100 px-1 rounded">https://mail.{getDomain(showConfig)}/webmail</code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Quota</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Usage</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {emails.map((mail) => (
                    <tr key={mail.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{mail.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{mail.quota_mb} MB</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${Math.min((mail.usage_mb / mail.quota_mb) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{mail.usage_mb}/{mail.quota_mb} MB</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={mail.status === "active" ? "success" : "destructive"}>{mail.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Mail config" onClick={() => setShowConfig(mail.email)}>
                            <Settings className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Change password" onClick={() => setChangePass({ id: mail.id, email: mail.email })}>
                            <Key className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Delete" onClick={() => deleteMail.mutate(mail.id)} className="text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {emails.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No mail accounts yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Config row component */
function ConfigRow({ label, value, onCopy }: { label: string; value: string; onCopy?: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}:</span>
      <div className="flex items-center gap-1.5">
        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-900">{value}</code>
        {onCopy && !value.startsWith("(") && (
          <button onClick={() => onCopy(value)} className="text-gray-400 hover:text-brand-600">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
