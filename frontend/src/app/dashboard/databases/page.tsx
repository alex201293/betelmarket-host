"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Database, Plus, Trash2, Copy, Settings, Info } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

interface DbItem {
  id: number;
  db_name: string;
  db_user: string;
  db_type: string;
  size_mb: number;
  max_connections: number;
  status: string;
  hosting_account?: { hestia_username: string; user?: { name: string } };
}

const mockDatabases: DbItem[] = [
  { id: 1, db_name: "bm_juan01_wordpress", db_user: "bm_juan01_wp", db_type: "mysql", size_mb: 85, max_connections: 10, status: "active" },
  { id: 2, db_name: "bm_juan01_store", db_user: "bm_juan01_store", db_type: "mysql", size_mb: 210, max_connections: 10, status: "active" },
  { id: 3, db_name: "bm_maria02_blog", db_user: "bm_maria02_blog", db_type: "mysql", size_mb: 32, max_connections: 5, status: "active" },
];

export default function DatabasesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ hosting_account_id: "1", db_name: "", db_user: "", db_password: "", db_type: "mysql" });
  const [editConn, setEditConn] = useState<{ id: number; value: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["databases"],
    queryFn: async () => {
      const { data } = await api.get("/databases");
      return data;
    },
  });

  const createDb = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/databases", {
        ...form,
        hosting_account_id: parseInt(form.hosting_account_id),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      toast.success(`Database created: ${data.credentials?.database || form.db_name}`);
      setShowCreate(false);
      setForm({ hosting_account_id: "1", db_name: "", db_user: "", db_password: "", db_type: "mysql" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteDb = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/databases/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["databases"] }); toast.success("Database deleted"); },
  });

  const updateConnections = useMutation({
    mutationFn: async () => {
      if (!editConn) return;
      await api.patch(`/databases/${editConn.id}/connections`, { max_connections: parseInt(editConn.value) });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["databases"] }); toast.success("Connection limit updated"); setEditConn(null); },
  });

  const databases: DbItem[] = data || mockDatabases;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Databases</h1>
          <p className="mt-1 text-sm text-gray-500">Manage MySQL/PostgreSQL databases.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" /> Create Database
        </Button>
      </div>

      {/* Info card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <Info className="h-4 w-4 text-brand-600" />
            <span className="text-gray-600">
              Each database user is limited to <strong className="text-gray-900">max connections</strong> as defined by your plan.
              This protects server resources.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create New Database</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createDb.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Database Name</label>
                  <Input placeholder="wordpress, store, etc." value={form.db_name} onChange={(e) => setForm({ ...form, db_name: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">DB User (optional)</label>
                  <Input placeholder="Same as DB name if empty" value={form.db_user} onChange={(e) => setForm({ ...form, db_user: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <Input type="password" placeholder="Auto-generated if empty" value={form.db_password} onChange={(e) => setForm({ ...form, db_password: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Type</label>
                  <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={form.db_type} onChange={(e) => setForm({ ...form, db_type: e.target.value })}>
                    <option value="mysql">MySQL / MariaDB</option>
                    <option value="pgsql">PostgreSQL</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createDb.isPending}>{createDb.isPending ? "Creating..." : "Create"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Databases table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Database</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">User</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Size</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Max Connections</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {databases.map((db) => (
                  <tr key={db.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm font-medium text-gray-900">{db.db_name}</span>
                        <button onClick={() => copyText(db.db_name)} className="text-gray-400 hover:text-brand-600"><Copy className="h-3 w-3" /></button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-gray-600">{db.db_user}</span>
                        <button onClick={() => copyText(db.db_user)} className="text-gray-400 hover:text-brand-600"><Copy className="h-3 w-3" /></button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">{db.db_type === "mysql" ? "MySQL" : "PostgreSQL"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{db.size_mb > 0 ? `${db.size_mb} MB` : "—"}</td>
                    <td className="px-5 py-3">
                      {editConn?.id === db.id ? (
                        <div className="flex items-center gap-1">
                          <Input type="number" value={editConn.value} onChange={(e) => setEditConn({ ...editConn, value: e.target.value })} className="w-16 h-7 text-xs" />
                          <Button size="sm" variant="ghost" onClick={() => updateConnections.mutate()}>✓</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditConn(null)}>✕</Button>
                        </div>
                      ) : (
                        <button onClick={() => setEditConn({ id: db.id, value: String(db.max_connections) })} className="flex items-center gap-1 text-gray-900 hover:text-brand-600">
                          <span className="font-semibold">{db.max_connections}</span>
                          <Settings className="h-3 w-3 text-gray-400" />
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteDb.mutate(db.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {databases.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No databases yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
