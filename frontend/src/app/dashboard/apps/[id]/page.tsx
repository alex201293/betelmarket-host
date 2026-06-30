"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Play, Square, RefreshCw, Rocket, Terminal, Trash2, Plus, Save,
  GitBranch, Globe, Key, Copy, CheckCircle2, XCircle, Clock, Webhook,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id as string;
  const queryClient = useQueryClient();

  // Fetch real app data
  const { data: appData } = useQuery({
    queryKey: ["app", appId],
    queryFn: async () => {
      const { data } = await api.get(`/apps/${appId}`);
      return data;
    },
  });

  // Mock fallback for demo
  const app = appData || {
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
    env_vars: { NODE_ENV: "production", PORT: "3001" },
    last_deploy_log: "Git: Already up to date.\n---\nInstall: added 245 packages in 8s\n---\nBuild: completed\n---\nPM2: started",
    last_deployed_at: "2024-10-22T10:00:00Z",
    deploy_secret: "demo_secret_123",
    auto_deploy: false,
    deploy_history: [
      { date: "2024-10-22T10:00:00Z", status: "success", message: "Deployed successfully" },
      { date: "2024-10-21T08:30:00Z", status: "success", message: "Deployed successfully" },
      { date: "2024-10-20T15:00:00Z", status: "failed", message: "Build failed: npm error" },
    ],
    domain: { domain: "api.ejemplo.com" },
  };

  const [envVars, setEnvVars] = useState<Record<string, string>>(app.env_vars || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(app.auto_deploy || false);

  const webhookUrl = `https://bpanel.betelmarket.com/api/webhooks/deploy/${appId}/${app.deploy_secret}`;

  const deploy = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/deploy`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["app", appId] }); toast.success("Deploy initiated"); },
  });

  const restart = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/restart`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["app", appId] }); toast.success("App restarted"); },
  });

  const stop = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/stop`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["app", appId] }); toast.success("App stopped"); },
  });

  const start = useMutation({
    mutationFn: () => api.post(`/apps/${appId}/start`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["app", appId] }); toast.success("App started"); },
  });

  const saveEnvVars = useMutation({
    mutationFn: () => api.patch(`/apps/${appId}`, { env_vars: envVars }),
    onSuccess: () => toast.success("Environment variables saved. Restart to apply."),
  });

  const toggleAutoDeploy = useMutation({
    mutationFn: () => api.patch(`/apps/${appId}`, { auto_deploy: !autoDeployEnabled }),
    onSuccess: () => { setAutoDeployEnabled(!autoDeployEnabled); toast.success(`Auto deploy ${!autoDeployEnabled ? "enabled" : "disabled"}`); },
  });

  const addEnvVar = () => {
    if (newKey && newValue) {
      setEnvVars({ ...envVars, [newKey]: newValue });
      setNewKey(""); setNewValue("");
    }
  };

  const removeEnvVar = (key: string) => {
    const updated = { ...envVars };
    delete updated[key];
    setEnvVars(updated);
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const statusColor = (s: string) => {
    switch (s) {
      case "running": return "success" as const;
      case "stopped": return "secondary" as const;
      case "deploying": return "warning" as const;
      default: return "destructive" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/apps"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
              <Badge variant={statusColor(app.status)}>{app.status}</Badge>
            </div>
            <p className="text-sm text-gray-500">{app.domain?.domain} • Port {app.port}</p>
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
          <Button onClick={() => deploy.mutate()} disabled={deploy.isPending}>
            <Rocket className="mr-1 h-4 w-4" /> {deploy.isPending ? "Deploying..." : "Deploy"}
          </Button>
        </div>
      </div>

      {/* Config overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Runtime</p>
          <p className="font-semibold text-gray-900">{app.runtime?.replace("nodejs_", "Node.js ").replace("python_", "Python 3.")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Entry Point</p>
          <p className="font-semibold text-gray-900 font-mono text-sm">{app.entry_point}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Last Deployed</p>
          <p className="font-semibold text-gray-900 text-sm">{app.last_deployed_at ? new Date(app.last_deployed_at).toLocaleString() : "Never"}</p>
        </CardContent></Card>
      </div>

      {/* Git & Auto Deploy */}
      {app.git_repo && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> Git & Auto Deploy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{app.git_repo}</p>
                <p className="text-xs text-gray-500">Branch: {app.git_branch}</p>
              </div>
            </div>

            {/* Auto Deploy toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto Deploy</p>
                <p className="text-xs text-gray-500">Deploy automatically on every push to {app.git_branch}</p>
              </div>
              <button
                onClick={() => toggleAutoDeploy.mutate()}
                className={`relative h-6 w-11 rounded-full transition-colors ${autoDeployEnabled ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${autoDeployEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Webhook URL */}
            {autoDeployEnabled && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Webhook URL</p>
                <p className="text-xs text-blue-700 mb-3">Add this URL to your GitHub/GitLab repository settings under Webhooks.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white border border-blue-200 px-3 py-2 text-xs font-mono text-gray-800 break-all">
                    {webhookUrl}
                  </code>
                  <button onClick={() => copyText(webhookUrl)} className="text-blue-600 hover:text-blue-800">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-1 text-xs text-blue-700">
                  <p>• GitHub: Settings → Webhooks → Add webhook → Content type: application/json</p>
                  <p>• GitLab: Settings → Webhooks → URL → Push events</p>
                  <p>• Trigger: Push events on branch <strong>{app.git_branch}</strong></p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <Button variant="ghost" size="icon" onClick={() => removeEnvVar(key)} className="text-red-500 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input placeholder="KEY" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="w-40 font-mono text-xs" />
            <Input placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={addEnvVar} className="shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          <p className="text-xs text-gray-500">Changes require a restart to take effect.</p>
        </CardContent>
      </Card>

      {/* Deploy History */}
      {app.deploy_history && app.deploy_history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Deploy History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {app.deploy_history.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  {entry.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{entry.message}</p>
                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</p>
                  </div>
                  <Badge variant={entry.status === "success" ? "success" : "destructive"}>{entry.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deploy Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Terminal className="h-4 w-4" /> Deploy Logs</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowLogs(!showLogs)}>
              {showLogs ? "Hide" : "Show"}
            </Button>
          </div>
        </CardHeader>
        {showLogs && (
          <CardContent>
            <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400 font-mono">
              {app.last_deploy_log || "No logs yet."}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
