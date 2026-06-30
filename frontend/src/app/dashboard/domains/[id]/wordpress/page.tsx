"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, ExternalLink, Download, RefreshCw,
  Plug, Trash2, Shield, Key, Loader2, Wrench, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function WordPressPage() {
  const params = useParams();
  const domainId = params.id as string;
  const queryClient = useQueryClient();

  const [showInstall, setShowInstall] = useState(false);
  const [installForm, setInstallForm] = useState({
    site_title: "",
    admin_user: "admin",
    admin_password: "",
    admin_email: "",
    locale: "en_US",
  });
  const [newPlugin, setNewPlugin] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Mock WP data for demo mode
  const { data: wpStatus, isLoading } = useQuery({
    queryKey: ["wordpress", domainId],
    queryFn: async () => {
      const { data } = await api.get(`/wordpress/${domainId}/status`);
      return data;
    },
  });

  const installWp = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/wordpress/${domainId}/install`, installForm);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] });
      toast.success("WordPress installation initiated. This may take a few minutes.");
      setShowInstall(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Installation failed"),
  });

  const updateCore = useMutation({
    mutationFn: () => api.post(`/wordpress/${domainId}/update-core`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] }); toast.success("WordPress updated"); },
  });

  const installPlugin = useMutation({
    mutationFn: async () => {
      await api.post(`/wordpress/${domainId}/plugins/install`, { plugin: newPlugin });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] }); toast.success("Plugin installed"); setNewPlugin(""); },
    onError: () => toast.error("Plugin installation failed"),
  });

  const deactivatePlugin = useMutation({
    mutationFn: async (plugin: string) => {
      await api.post(`/wordpress/${domainId}/plugins/deactivate`, { plugin });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] }); toast.success("Plugin deactivated"); },
  });

  const deletePlugin = useMutation({
    mutationFn: async (plugin: string) => {
      await api.post(`/wordpress/${domainId}/plugins/delete`, { plugin });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] }); toast.success("Plugin deleted"); },
  });

  const updatePlugins = useMutation({
    mutationFn: () => api.post(`/wordpress/${domainId}/plugins/update-all`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] }); toast.success("All plugins updated"); },
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      await api.post(`/wordpress/${domainId}/reset-password`, { new_password: newPassword });
    },
    onSuccess: () => { toast.success("Admin password reset"); setNewPassword(""); },
  });

  const flushCache = useMutation({
    mutationFn: () => api.post(`/wordpress/${domainId}/flush-cache`),
    onSuccess: () => toast.success("Cache flushed"),
  });

  const toggleMaintenance = useMutation({
    mutationFn: (enabled: boolean) => api.post(`/wordpress/${domainId}/maintenance`, { enabled }),
    onSuccess: () => toast.success("Maintenance mode toggled"),
  });

  const uninstallWp = useMutation({
    mutationFn: () => api.post(`/wordpress/${domainId}/uninstall`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordpress", domainId] });
      toast.success("WordPress uninstalled. You can reinstall anytime.");
    },
    onError: () => toast.error("Failed to uninstall"),
  });

  // Demo mock data
  const isInstalled = wpStatus?.installed ?? true;
  const wpVersion = wpStatus?.version || "6.5.2";
  const siteUrl = wpStatus?.site_url || "https://ejemplo.com";
  const plugins = wpStatus?.plugins || [
    { name: "akismet", status: "active", version: "5.3", update: "none" },
    { name: "woocommerce", status: "active", version: "8.7.0", update: "available" },
    { name: "yoast-seo", status: "active", version: "22.3", update: "none" },
    { name: "contact-form-7", status: "inactive", version: "5.9", update: "none" },
  ];
  const hasUpdates = wpStatus?.updates_available ?? true;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  // WordPress NOT installed — show install form
  if (!isInstalled) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/domains/${domainId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Install WordPress</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); installWp.mutate(); }} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Site Title</label>
                <Input placeholder="My Website" value={installForm.site_title} onChange={(e) => setInstallForm({ ...installForm, site_title: e.target.value })} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Admin Username</label>
                  <Input value={installForm.admin_user} onChange={(e) => setInstallForm({ ...installForm, admin_user: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Admin Email</label>
                  <Input type="email" placeholder="admin@example.com" value={installForm.admin_email} onChange={(e) => setInstallForm({ ...installForm, admin_email: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Admin Password</label>
                <Input type="password" placeholder="Min 8 characters" value={installForm.admin_password} onChange={(e) => setInstallForm({ ...installForm, admin_password: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Language</label>
                <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm" value={installForm.locale} onChange={(e) => setInstallForm({ ...installForm, locale: e.target.value })}>
                  <option value="en_US">English</option>
                  <option value="es_ES">Español</option>
                  <option value="pt_BR">Português</option>
                  <option value="fr_FR">Français</option>
                </select>
              </div>
              <Button type="submit" disabled={installWp.isPending}>
                {installWp.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Installing...</> : <><Download className="mr-2 h-4 w-4" /> Install WordPress</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // WordPress IS installed — show admin panel
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/domains/${domainId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WordPress Manager</h1>
            <p className="mt-0.5 text-sm text-gray-500">{siteUrl}</p>
          </div>
        </div>
        <a href={`${siteUrl}/wp-admin`} target="_blank" rel="noopener noreferrer">
          <Button><ExternalLink className="mr-2 h-4 w-4" /> Admin Panel</Button>
        </a>
      </div>

      {/* Info + Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500">WordPress Version</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-lg font-bold text-gray-900">{wpVersion}</p>
              {hasUpdates && <Badge variant="warning">Update available</Badge>}
            </div>
            {hasUpdates && (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => updateCore.mutate()} disabled={updateCore.isPending}>
                <RefreshCw className="mr-1 h-3 w-3" /> Update
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500">Plugins</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{plugins.length} installed</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => updatePlugins.mutate()} disabled={updatePlugins.isPending}>
              <RefreshCw className="mr-1 h-3 w-3" /> Update All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-gray-500">Quick Actions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => flushCache.mutate()} disabled={flushCache.isPending}>
                <Zap className="mr-1 h-3 w-3" /> Flush Cache
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleMaintenance.mutate(true)}>
                <Wrench className="mr-1 h-3 w-3" /> Maintenance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plugins</CardTitle>
            <form onSubmit={(e) => { e.preventDefault(); installPlugin.mutate(); }} className="flex gap-2">
              <Input placeholder="Plugin slug (e.g., wordfence)" value={newPlugin} onChange={(e) => setNewPlugin(e.target.value)} className="w-56" />
              <Button size="sm" type="submit" disabled={!newPlugin || installPlugin.isPending}>
                <Plug className="mr-1 h-3 w-3" /> Install
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium text-gray-500">Plugin</th>
                <th className="px-5 py-2.5 text-left font-medium text-gray-500">Version</th>
                <th className="px-5 py-2.5 text-left font-medium text-gray-500">Status</th>
                <th className="px-5 py-2.5 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {plugins.map((p: any) => (
                <tr key={p.name} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600">{p.version}</td>
                  <td className="px-5 py-3">
                    <Badge variant={p.status === "active" ? "success" : "secondary"}>{p.status}</Badge>
                    {p.update === "available" && <Badge variant="warning" className="ml-1">update</Badge>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === "active" ? (
                        <Button size="sm" variant="ghost" onClick={() => deactivatePlugin.mutate(p.name)}>Deactivate</Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deletePlugin.mutate(p.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Security section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Reset Admin Password</label>
              <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button onClick={() => resetPassword.mutate()} disabled={!newPassword || resetPassword.isPending}>
              <Key className="mr-1 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uninstall */}
      <Card className="border-red-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-700">Uninstall WordPress</h3>
              <p className="text-sm text-gray-500 mt-1">This will delete all WordPress files and database. You can reinstall later.</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => { if (confirm("Are you sure? This will delete all WordPress files and data.")) uninstallWp.mutate(); }}
              disabled={uninstallWp.isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {uninstallWp.isPending ? "Uninstalling..." : "Uninstall WordPress"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
