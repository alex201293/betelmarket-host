"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Play, Square, RefreshCw, Rocket, Terminal, Trash2, Plus, Save,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id as string;
  const queryClient = useQueryClient();

  // Mock app detail
  const app = {
    id: parseInt(appId),
    name: "my-api",
    runtime: "nodejs_20",
    port: 3001,
    status: "running",
    entry_point: "src/index.js",
    git_repo: "https://github.com/user/my-api.git",
    git_branch: "main",
    start_command: "npm start",
    build_command: "npm run build",
    install_command: "npm install",
    env_vars: { NODE_ENV: "production", PORT: "3001", DB_HOST: "localhost", API_KEY: "sk_live_xxxxx" },
    last_deploy_log: "Git: Already up to date.\n---\nInstall: added 245 packages in 8s\n---\nBuild: Build completed successfully\n---\nPM2: [PM2] Process started",
    last_deployed_at: "2024-10-22T10:00:00Z",
    domain: { domain: "api.ejemplo.com" },
  };

  const [envVars, setEnvVars] = useState<Record<string, string>>(app.env_vars);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const deploy = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/deploy`),
    onSuccess: () => toast.success("Deploy initiated"),
  });

  const restart = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/restart`),
    onSuccess: () => toast.success("App restarted"),
  });

  const stop = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/stop`),
    onSuccess: () => toast.success("App stopped"),
  });

  const start = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/start`),
    onSuccess: () => toast.success("App started"),
  });

  const saveEnvVars = useMutation({
    mutationFn: () => api.patch(`/apps/${appId}`, { env_vars: envVars }),
    onSuccess: () => toast.success("Environment variables saved. Restart to apply."),
  });

  const addEnvVar = () => {
    if (newKey && newValue) {
      setEnvVars({ ...envVars, [newKey]: newValue });
      setNewKey("");
      setNewValue("");
    }
  };

  const removeEnvVar = (key: string) => {
    const updated = { ...envVars };
    delete updated[key];
    setEnvVars(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/apps">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
              <Badge variant={app.status === "running" ? "success" : "secondary"}>{app.status}</Badge>
            </div>
            <p className="text-sm text-gray-500">{app.domain.domain} • Port {app.port}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {app.status === "running" ? (
            <>
              <Button variant="outline" onClick={() => restart.mutate()}><RefreshCw className="mr-1 h-4 w-4" /> Restart</Button>
              <Button variant="outline" onClick={() => stop.mutate()}><Square className="mr-1 h-4 w-4" /> Stop</Button>
            </>
          ) : (
            <Button onClick={() => start.mutate()}><Play className="mr-1 h-4 w-4" /> Start</Button>
          )}
          <Button onClick={() => deploy.mutate()}><Rocket className="mr-1 h-4 w-4" /> Deploy</Button>
        </div>
      </div>

      {/* Config overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Runtime</p>
          <p className="font-semibold text-gray-900">Node.js 20 LTS</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Entry Point</p>
          <p className="font-semibold text-gray-900 font-mono text-sm">{app.entry_point}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Last Deployed</p>
          <p className="font-semibold text-gray-900">{new Date(app.last_deployed_at).toLocaleString()}</p>
        </CardContent></Card>
      </div>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Environment Variables</CardTitle>
            <Button size="sm" onClick={() => saveEnvVars.mutate()} disabled={saveEnvVars.isPending}>
              <Save className="mr-1 h-3 w-3" /> Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Input value={key} disabled className="w-40 bg-gray-50 font-mono text-xs" />
              <Input value={value} onChange={(e) => setEnvVars({ ...envVars, [key]: e.target.value })} className="font-mono text-xs" />
              <Button variant="ghost" size="icon" onClick={() => removeEnvVar(key)} className="text-red-500 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input placeholder="KEY" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="w-40 font-mono text-xs" />
            <Input placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={addEnvVar} className="shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">Changes require a restart to take effect.</p>
        </CardContent>
      </Card>

      {/* Deploy Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal className="h-4 w-4" /> Deploy Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400 font-mono">
            {app.last_deploy_log || "No logs yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
