"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Play, Square, RefreshCw, Rocket, Trash2, Terminal, GitBranch, ExternalLink, Globe,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AppItem {
  id: number;
  name: string;
  runtime: string;
  port: number;
  status: string;
  git_repo: string | null;
  git_branch: string;
  last_deployed_at: string | null;
  domain?: { domain: string };
}

// Mock apps
const mockApps: AppItem[] = [
  { id: 1, name: "my-api", runtime: "nodejs_20", port: 3001, status: "running", git_repo: "https://github.com/user/my-api.git", git_branch: "main", last_deployed_at: "2024-10-22T10:00:00Z", domain: { domain: "api.ejemplo.com" } },
  { id: 2, name: "flask-app", runtime: "python_312", port: 3002, status: "running", git_repo: "https://github.com/user/flask-app.git", git_branch: "production", last_deployed_at: "2024-10-21T15:30:00Z", domain: { domain: "app.mitienda.shop" } },
  { id: 3, name: "landing-next", runtime: "nodejs_22", port: 3003, status: "stopped", git_repo: null, git_branch: "main", last_deployed_at: null, domain: { domain: "startup.io" } },
];

const runtimes: Record<string, { name: string; color: string }> = {
  nodejs_18: { name: "Node.js 18", color: "bg-green-100 text-green-700" },
  nodejs_20: { name: "Node.js 20", color: "bg-green-100 text-green-700" },
  nodejs_22: { name: "Node.js 22", color: "bg-green-100 text-green-700" },
  python_311: { name: "Python 3.11", color: "bg-blue-100 text-blue-700" },
  python_312: { name: "Python 3.12", color: "bg-blue-100 text-blue-700" },
  ruby_33: { name: "Ruby 3.3", color: "bg-red-100 text-red-700" },
  go_122: { name: "Go 1.22", color: "bg-cyan-100 text-cyan-700" },
  bun_1: { name: "Bun 1.x", color: "bg-orange-100 text-orange-700" },
  deno_1: { name: "Deno 1.x", color: "bg-gray-100 text-gray-700" },
};

export default function AppsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    domain_id: "1",
    name: "",
    runtime: "nodejs_20",
    entry_point: "index.js",
    git_repo: "",
    git_branch: "main",
    start_command: "",
    build_command: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const { data } = await api.get("/apps");
      return data;
    },
  });

  const createApp = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/apps", form);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast.success("App created! Deploy will start if a Git repo was provided.");
      setShowCreate(false);
      setForm({ domain_id: "1", name: "", runtime: "nodejs_20", entry_point: "index.js", git_repo: "", git_branch: "main", start_command: "", build_command: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deployApp = useMutation({
    mutationFn: async (id: number) => { await api.post(`/apps/${id}/deploy`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["apps"] }); toast.success("Deploy initiated"); },
  });

  const startApp = useMutation({
    mutationFn: async (id: number) => { await api.post(`/apps/${id}/start`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["apps"] }); toast.success("App started"); },
  });

  const stopApp = useMutation({
    mutationFn: async (id: number) => { await api.post(`/apps/${id}/stop`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["apps"] }); toast.success("App stopped"); },
  });

  const restartApp = useMutation({
    mutationFn: async (id: number) => { await api.post(`/apps/${id}/restart`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["apps"] }); toast.success("App restarted"); },
  });

  const deleteApp = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/apps/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["apps"] }); toast.success("App deleted"); },
  });

  const apps: AppItem[] = data?.data || mockApps;

  const statusColor = (s: string) => {
    switch (s) {
      case "running": return "success" as const;
      case "stopped": return "secondary" as const;
      case "deploying": return "warning" as const;
      case "error": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apps</h1>
          <p className="mt-1 text-sm text-gray-500">Deploy and manage Node.js, Python, Go, and more.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" /> New App
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create New App</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createApp.mutate(); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">App Name</label>
                  <Input placeholder="my-app (alphanumeric + dashes)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Runtime</label>
                  <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={form.runtime} onChange={(e) => setForm({ ...form, runtime: e.target.value })}>
                    {Object.entries(runtimes).map(([key, val]) => (
                      <option key={key} value={key}>{val.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Git Repository (optional)</label>
                  <Input placeholder="https://github.com/user/repo.git" value={form.git_repo} onChange={(e) => setForm({ ...form, git_repo: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Branch</label>
                  <Input value={form.git_branch} onChange={(e) => setForm({ ...form, git_branch: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Entry Point</label>
                  <Input placeholder="index.js, app.py, main.go" value={form.entry_point} onChange={(e) => setForm({ ...form, entry_point: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Start Command (optional)</label>
                  <Input placeholder="npm start, python app.py" value={form.start_command} onChange={(e) => setForm({ ...form, start_command: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createApp.isPending}>
                  {createApp.isPending ? "Creating..." : "Create App"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Apps list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : apps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Terminal className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No apps deployed yet.</p>
            </CardContent>
          </Card>
        ) : (
          apps.map((app) => (
            <Card key={app.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
                      <Terminal className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{app.name}</p>
                        <Badge className={runtimes[app.runtime]?.color || "bg-gray-100 text-gray-700"}>
                          {runtimes[app.runtime]?.name || app.runtime}
                        </Badge>
                        <Badge variant={statusColor(app.status)}>{app.status}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        {app.domain && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" /> {app.domain.domain}
                          </span>
                        )}
                        <span>Port: {app.port}</span>
                        {app.git_repo && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" /> {app.git_branch}
                          </span>
                        )}
                        {app.last_deployed_at && (
                          <span>Deployed: {new Date(app.last_deployed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {app.status === "running" ? (
                      <>
                        <Button variant="ghost" size="icon" title="Restart" onClick={() => restartApp.mutate(app.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Stop" onClick={() => stopApp.mutate(app.id)}>
                          <Square className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" title="Start" onClick={() => startApp.mutate(app.id)}>
                        <Play className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Deploy" onClick={() => deployApp.mutate(app.id)}>
                      <Rocket className="h-4 w-4 text-brand-600" />
                    </Button>
                    <Link href={`/dashboard/apps/${app.id}`}>
                      <Button variant="outline" size="sm">Manage</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
