"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FolderUp, Plus, Trash2, Key, Copy, Server } from "lucide-react";
import { toast } from "sonner";

interface FtpAccount {
  username: string;
  domain: string;
  domain_id: number;
  path: string;
  status: string;
}

// Mock data
const mockFtpAccounts: FtpAccount[] = [
  { username: "bm_juan01_web", domain: "ejemplo.com", domain_id: 1, path: "/home/bm_juan01/web/ejemplo.com/public_html", status: "active" },
  { username: "bm_juan01_deploy", domain: "ejemplo.com", domain_id: 1, path: "/home/bm_juan01/web/ejemplo.com/public_html", status: "active" },
  { username: "bm_maria02_main", domain: "mitienda.shop", domain_id: 2, path: "/home/bm_maria02/web/mitienda.shop/public_html", status: "active" },
];

export default function FtpPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [form, setForm] = useState({ domain_id: "", ftp_user: "", ftp_password: "", path: "" });
  const [newPass, setNewPass] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ftp"],
    queryFn: async () => {
      const { data } = await api.get("/ftp");
      return data;
    },
  });

  const createFtp = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/ftp", {
        domain_id: parseInt(form.domain_id),
        ftp_user: form.ftp_user,
        ftp_password: form.ftp_password,
        path: form.path || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ftp"] });
      toast.success(`FTP account created: ${data.ftp_user || form.ftp_user}`);
      setShowCreate(false);
      setForm({ domain_id: "", ftp_user: "", ftp_password: "", path: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const changePassword = useMutation({
    mutationFn: async (account: FtpAccount) => {
      await api.post("/ftp/change-password", {
        domain_id: account.domain_id,
        ftp_user: account.username,
        new_password: newPass,
      });
    },
    onSuccess: () => { toast.success("Password changed"); setShowPassword(null); setNewPass(""); },
  });

  const deleteFtp = useMutation({
    mutationFn: async (account: FtpAccount) => {
      await api.delete("/ftp", { data: { domain_id: account.domain_id, ftp_user: account.username } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ftp"] }); toast.success("FTP account deleted"); },
  });

  const accounts: FtpAccount[] = data || mockFtpAccounts;
  const serverHost = "ftp.tuservidor.com"; // Will come from config in production

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FTP Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage FTP access for file uploads.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" /> Create FTP Account
        </Button>
      </div>

      {/* Connection info */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm">
              <h3 className="font-semibold text-gray-900">Connection Details</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Host:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">{serverHost}</code>
                  <button onClick={() => copyText(serverHost)} className="text-gray-400 hover:text-brand-600"><Copy className="h-3 w-3" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Port:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">21</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Protocol:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">FTP / SFTP (port 22)</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader><CardTitle>New FTP Account</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createFtp.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Domain</label>
                  <Input placeholder="Domain ID" type="number" value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">FTP Username</label>
                  <Input placeholder="deploy, uploads, etc." value={form.ftp_user} onChange={(e) => setForm({ ...form, ftp_user: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <Input type="password" placeholder="Min 8 characters" value={form.ftp_password} onChange={(e) => setForm({ ...form, ftp_password: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Path (optional)</label>
                  <Input placeholder="/public_html (default)" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createFtp.isPending}>
                  {createFtp.isPending ? "Creating..." : "Create Account"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts list */}
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
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Username</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Domain</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Path</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accounts.map((account) => (
                    <tr key={account.username} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <FolderUp className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm font-medium text-gray-900">{account.username}</span>
                          <button onClick={() => copyText(account.username)} className="text-gray-400 hover:text-brand-600">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{account.domain}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[200px] truncate">{account.path}</td>
                      <td className="px-5 py-3">
                        <Badge variant="success">{account.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setShowPassword(account.username)}>
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteFtp.mutate(account)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {accounts.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No FTP accounts yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change password modal */}
      {showPassword && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Change Password — {showPassword}</h3>
            <div className="flex gap-2">
              <Input type="password" placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="max-w-xs" />
              <Button onClick={() => {
                const account = accounts.find(a => a.username === showPassword);
                if (account) changePassword.mutate(account);
              }} disabled={!newPass}>
                Change
              </Button>
              <Button variant="outline" onClick={() => setShowPassword(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
