"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Cpu, Zap, Settings, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SiteConfigPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [phpVersion, setPhpVersion] = useState("8.3");
  const [template, setTemplate] = useState("default");
  const [opcache, setOpcache] = useState(true);
  const [settings, setSettings] = useState({
    upload_max_filesize: "64M",
    post_max_size: "64M",
    memory_limit: "256M",
    max_execution_time: "300",
    max_input_vars: "3000",
    display_errors: "Off",
  });

  const changePhp = useMutation({
    mutationFn: async () => {
      await api.post(`/config/${siteId}/php-version`, { version: phpVersion });
    },
    onSuccess: () => toast.success(`PHP version changed to ${phpVersion}`),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      await api.patch(`/config/${siteId}/php-settings`, settings);
    },
    onSuccess: () => toast.success("PHP settings saved. FPM restarted."),
  });

  const changeTemplate = useMutation({
    mutationFn: async () => {
      await api.post(`/config/${siteId}/template`, { template });
    },
    onSuccess: () => toast.success(`Nginx template changed to: ${template}`),
  });

  const toggleOpcache = useMutation({
    mutationFn: async () => {
      await api.post(`/config/${siteId}/opcache`, { enabled: !opcache });
    },
    onSuccess: () => { setOpcache(!opcache); toast.success(opcache ? "OPcache disabled" : "OPcache enabled"); },
  });

  const phpVersions = ["7.4", "8.0", "8.1", "8.2", "8.3"];
  const templates = [
    { value: "default", label: "Default" },
    { value: "caching", label: "Caching (static assets)" },
    { value: "wordpress", label: "WordPress Optimized" },
    { value: "nodejs", label: "Node.js Proxy" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/sites/${siteId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">PHP version, server settings, and performance.</p>
        </div>
      </div>

      {/* PHP Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-brand-600" /> PHP Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {phpVersions.map((v) => (
                <button
                  key={v}
                  onClick={() => setPhpVersion(v)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    phpVersion === v
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  PHP {v}
                </button>
              ))}
            </div>
            <Button onClick={() => changePhp.mutate()} disabled={changePhp.isPending}>
              <RefreshCw className="mr-1 h-4 w-4" />
              {changePhp.isPending ? "Changing..." : "Apply"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Current: PHP {phpVersion}. Changing version will restart PHP-FPM.
          </p>
        </CardContent>
      </Card>

      {/* Nginx Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-600" /> Web Server Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <button
                key={t.value}
                onClick={() => setTemplate(t.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  template === t.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`text-sm font-medium ${template === t.value ? "text-brand-700" : "text-gray-900"}`}>
                  {t.label}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Button variant="outline" onClick={() => changeTemplate.mutate()} disabled={changeTemplate.isPending}>
              {changeTemplate.isPending ? "Applying..." : "Apply Template"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OPcache */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">OPcache</p>
                <p className="text-xs text-gray-500">Caches compiled PHP scripts for faster execution.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={opcache ? "success" : "secondary"}>
                {opcache ? "Enabled" : "Disabled"}
              </Badge>
              <button
                onClick={() => toggleOpcache.mutate()}
                className={`relative h-6 w-11 rounded-full transition-colors ${opcache ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${opcache ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHP Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-600" /> PHP Settings (php.ini)
            </CardTitle>
            <Button size="sm" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
              <Save className="mr-1 h-3.5 w-3.5" />
              {saveSettings.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SettingInput label="upload_max_filesize" value={settings.upload_max_filesize} onChange={(v) => setSettings({ ...settings, upload_max_filesize: v })} hint="Max upload size" />
            <SettingInput label="post_max_size" value={settings.post_max_size} onChange={(v) => setSettings({ ...settings, post_max_size: v })} hint="Max POST data" />
            <SettingInput label="memory_limit" value={settings.memory_limit} onChange={(v) => setSettings({ ...settings, memory_limit: v })} hint="PHP memory limit" />
            <SettingInput label="max_execution_time" value={settings.max_execution_time} onChange={(v) => setSettings({ ...settings, max_execution_time: v })} hint="Seconds" />
            <SettingInput label="max_input_vars" value={settings.max_input_vars} onChange={(v) => setSettings({ ...settings, max_input_vars: v })} hint="Form variables" />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">display_errors</label>
              <select
                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                value={settings.display_errors}
                onChange={(e) => setSettings({ ...settings, display_errors: e.target.value })}
              >
                <option value="Off">Off (Production)</option>
                <option value="On">On (Debug)</option>
              </select>
              <p className="mt-1 text-[11px] text-gray-400">Show PHP errors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700 font-mono">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
      <p className="mt-1 text-[11px] text-gray-400">{hint}</p>
    </div>
  );
}
