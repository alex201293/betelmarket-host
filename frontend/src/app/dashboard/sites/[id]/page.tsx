"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe, ExternalLink, Shield, Lock, Zap, Database,
  HardDrive, FolderOpen, RefreshCw, CheckCircle2, Settings, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.id as string;
  const queryClient = useQueryClient();

  const { data: domainsData } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => { const { data } = await api.get("/domains"); return data; },
  });

  const { data: wpData } = useQuery({
    queryKey: ["wordpress-status", siteId],
    queryFn: async () => { const { data } = await api.get(`/wordpress/${siteId}/status`); return data; },
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: async () => { const { data } = await api.get("/usage"); return data; },
  });

  const { data: hostingData } = useQuery({
    queryKey: ["hosting"],
    queryFn: async () => { const { data } = await api.get("/hosting"); return data; },
  });

  const uninstallWp = useMutation({
    mutationFn: () => api.post(`/wordpress/${siteId}/uninstall`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordpress-status", siteId] });
      toast.success("WordPress uninstalled successfully");
    },
    onError: () => toast.error("Failed to uninstall"),
  });

  const domain = (domainsData?.data || []).find((d: any) => d.id === parseInt(siteId));
  const domainName = domain?.domain || "...";
  const account = (hostingData?.data || [])[0];
  const planName = account?.plan?.name || "—";

  // WordPress data (real from API)
  const wpInstalled = wpData?.installed || false;
  const wpVersion = wpData?.version || "—";
  const wpTheme = wpData?.themes?.find((t: any) => t.status === "active")?.name || "—";
  const wpPlugins = wpData?.plugins || [];
  const updatesCount = wpPlugins.filter((p: any) => p.update === "available").length + (wpData?.updates_available ? 1 : 0);

  // Usage data (real from API)
  const diskUsed = usageData?.disk_used_mb || 0;
  const diskLimit = usageData?.disk_limit_mb || 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/sites" className="hover:text-brand-600">Sitios web</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{domainName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <Link href="/dashboard/plans"><Button variant="outline">Mejorar plan</Button></Link>
      </div>

      {/* Site card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
                <Globe className="h-7 w-7 text-brand-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-gray-900">{domainName}</p>
                  <a href={`https://${domainName}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-gray-400 hover:text-brand-600" />
                  </a>
                </div>
                <p className="text-xs text-gray-500">Plan: {planName}</p>
              </div>
            </div>
            {wpInstalled && (
              <Link href={`/dashboard/domains/${siteId}/wordpress`}>
                <Button>Admin WordPress <ExternalLink className="ml-2 h-3.5 w-3.5" /></Button>
              </Link>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/dashboard/domains/${siteId}`}><Button variant="outline" size="sm"><Globe className="mr-1.5 h-3.5 w-3.5" /> Administrar dominio</Button></Link>
            <Link href={`/dashboard/sites/${siteId}/config`}><Button variant="outline" size="sm"><Settings className="mr-1.5 h-3.5 w-3.5" /> PHP & Config</Button></Link>
            <Link href="/dashboard/mail"><Button variant="outline" size="sm">✉ Administrar email</Button></Link>
            <Link href="/dashboard/files"><Button variant="outline" size="sm"><FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Archivos</Button></Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {domain?.ssl_enabled && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"><Lock className="h-3 w-3" /> SSL</span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"><Shield className="h-3 w-3" /> Protected</span>
          </div>
        </CardContent>
      </Card>

      {/* WordPress Health - only if installed */}
      {wpInstalled && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Salud del sitio</h3>
                {updatesCount > 0 && <Badge variant="warning">Acción necesaria</Badge>}
                {updatesCount === 0 && <Badge variant="success">OK</Badge>}
              </div>
              <Link href={`/dashboard/domains/${siteId}/wordpress`}><Button variant="outline" size="sm">Ver detalles</Button></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-xs text-gray-500">Versión WordPress</p><p className="font-semibold text-gray-900">{wpVersion}</p></div>
              <div><p className="text-xs text-gray-500">Tema activo</p><p className="font-semibold text-gray-900">{wpTheme}</p></div>
              <div><p className="text-xs text-gray-500">Plugins</p><p className="font-semibold text-gray-900">{wpPlugins.length} instalados {updatesCount > 0 && <span className="text-brand-600">({updatesCount} updates)</span>}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* If WordPress NOT installed */}
      {!wpInstalled && (
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-gray-600 mb-3">WordPress no está instalado en este sitio.</p>
            <Link href={`/dashboard/domains/${siteId}/wordpress`}>
              <Button>Instalar WordPress</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Essentials */}
        <Card>
          <CardHeader><CardTitle>Esenciales</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-0">
            <EssentialItem icon={Database} title="Base de datos" subtitle="Administrar bases de datos" href="/dashboard/databases" action="Administrar" />
            <EssentialItem icon={HardDrive} title="Copias de seguridad" subtitle="Crear y restaurar backups" href="/dashboard/backups" action="Ver" />
            <EssentialItem icon={FolderOpen} title="Administrador de archivos" subtitle="Edita tus archivos" href="/dashboard/files" action="Abrir" />
            {wpInstalled && <EssentialItem icon={RefreshCw} title="Caché" subtitle="Ver cambios recientes" href={`/dashboard/domains/${siteId}/wordpress`} action="Borrar caché" />}
            <div className="border-t border-gray-100 px-5 py-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-900">Plan de hosting</p><p className="text-xs text-gray-500">{planName}</p></div>
                <Link href="/dashboard/plans"><span className="text-sm text-brand-600">›</span></Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between"><CardTitle>Uso de recursos</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray={`${(diskUsed / diskLimit) * 100}, 100`} />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Uso del disco</p>
                <p className="text-lg font-bold text-gray-900">{formatBytes(diskUsed)} <span className="text-sm font-normal text-gray-500">/ {formatBytes(diskLimit)}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">Dominios</p><p className="text-sm font-bold text-gray-900">{usageData?.domains || 0}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">Correos</p><p className="text-sm font-bold text-gray-900">{usageData?.mailboxes || 0}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uninstall WordPress */}
      {wpInstalled && (
        <Card className="border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-700">Desinstalar WordPress</h3>
                <p className="text-sm text-gray-500 mt-1">Elimina todos los archivos y base de datos de WordPress. Podés reinstalar después.</p>
              </div>
              <Button variant="destructive" onClick={() => { if (confirm("¿Estás seguro? Se eliminarán todos los archivos y datos de WordPress.")) uninstallWp.mutate(); }} disabled={uninstallWp.isPending}>
                <Trash2 className="mr-1 h-4 w-4" /> {uninstallWp.isPending ? "Desinstalando..." : "Desinstalar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EssentialItem({ icon: Icon, title, subtitle, href, action }: { icon: any; title: string; subtitle: string; href: string; action?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 first:border-t-0">
      <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-900">{title}</p><p className="text-xs text-gray-500">{subtitle}</p></div></div>
      {action && <Link href={href}><Button variant="outline" size="sm">{action}</Button></Link>}
    </div>
  );
}
