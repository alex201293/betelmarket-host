"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Plus, RotateCcw, X, Mail, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Migration {
  id: number;
  source_host: string;
  source_email: string;
  destination_email: string;
  status: string;
  messages_migrated: number;
  messages_total: number;
  error_log: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  domain?: { domain: string };
}

export default function MigrationsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    domain_id: "",
    source_host: "",
    source_port: "993",
    source_email: "",
    source_password: "",
    destination_email: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["migrations"],
    queryFn: async () => {
      const { data } = await api.get("/migrations");
      return data;
    },
  });

  const { data: domainsData } = useQuery({
    queryKey: ["domains-for-migration"],
    queryFn: async () => {
      const { data } = await api.get("/domains");
      return data;
    },
  });

  const domainsList = (domainsData?.data || []).filter((d: any) => d.status === "active" && !d.is_temporary);

  const createMigration = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/migrations", {
        ...form,
        domain_id: parseInt(form.domain_id),
        source_port: parseInt(form.source_port),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["migrations"] });
      toast.success("Migration initiated — this may take a while depending on mailbox size.");
      setShowCreate(false);
      setForm({ domain_id: "", source_host: "", source_port: "993", source_email: "", source_password: "", destination_email: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to start migration"),
  });

  const retryMigration = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/migrations/${id}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["migrations"] });
      toast.success("Migration retry initiated");
    },
  });

  const migrations: Migration[] = data?.data || [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success" as const;
      case "failed": return "destructive" as const;
      case "in_progress": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mail Migration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Migrate email accounts from another provider to your hosting.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          New Migration
        </Button>
      </div>

      {/* How it works */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-brand-50 p-2.5">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">How migration works</h3>
              <ol className="mt-2 space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Create the destination mailbox in your panel first (Mail section)</li>
                <li>Enter your source server details (host, email, password)</li>
                <li>The system will copy all emails via IMAP sync</li>
                <li>Once complete, update your MX records to point to this server</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Start New Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); createMigration.mutate(); }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Source */}
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Server className="h-4 w-4 text-gray-400" />
                    Source (old provider)
                  </div>
                  <Input
                    placeholder="IMAP Host (e.g., mail.hostinger.com)"
                    value={form.source_host}
                    onChange={(e) => setForm({ ...form, source_host: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Port (default: 993)"
                    type="number"
                    value={form.source_port}
                    onChange={(e) => setForm({ ...form, source_port: e.target.value })}
                  />
                  <Input
                    placeholder="Email (e.g., info@tudominio.com)"
                    type="email"
                    value={form.source_email}
                    onChange={(e) => setForm({ ...form, source_email: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={form.source_password}
                    onChange={(e) => setForm({ ...form, source_password: e.target.value })}
                    required
                  />
                </div>

                {/* Destination */}
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail className="h-4 w-4 text-brand-600" />
                    Destination (this server)
                  </div>
                  <select
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                    value={form.domain_id}
                    onChange={(e) => setForm({ ...form, domain_id: e.target.value })}
                    required
                  >
                    <option value="">Select domain...</option>
                    {domainsList.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.domain}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Destination email (e.g., info@tudominio.com)"
                    type="email"
                    value={form.destination_email}
                    onChange={(e) => setForm({ ...form, destination_email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Make sure this mailbox already exists in the Mail section.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMigration.isPending}>
                  {createMigration.isPending ? "Starting..." : "Start Migration"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Migrations list */}
      <Card>
        <CardHeader>
          <CardTitle>Migration History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Source</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Destination</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Messages</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {migrations.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{m.source_email}</p>
                          <p className="text-xs text-gray-500">{m.source_host}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{m.destination_email}</p>
                        <p className="text-xs text-gray-500">{m.domain?.domain}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                        {m.status === "in_progress" && (
                          <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-brand-500 transition-all"
                              style={{ width: `${m.messages_total > 0 ? (m.messages_migrated / m.messages_total) * 100 : 50}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {m.messages_migrated > 0 ? `${m.messages_migrated}` : "—"}
                        {m.messages_total > 0 && ` / ${m.messages_total}`}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {m.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryMigration.mutate(m.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {migrations.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No migrations yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
