"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe, ExternalLink, Shield, Lock, Zap, Database,
  HardDrive, FolderOpen, RefreshCw, ArrowLeft, CheckCircle2, Settings,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatBytes } from "@/lib/utils";

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.id as string;

  const { data: domainsData } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data } = await api.get("/domains");
      return data;
    },
  });

  const domain = (domainsData?.data || []).find((d: any) => d.id === parseInt(siteId));
  const domainName = domain?.domain || "ejemplo.com";

  // Mock site data
  const siteInfo = {
    wp_version: "7.0",
    php_version: "8.3",
    theme: "Royal Starter Theme 1.0",
    plugins_count: 4,
    updates_available: 4,
    vulnerabilities: "None detected",
    disk_used_mb: 8990,
    disk_limit_mb: 204800,
    cpu_percent: 5,
    inodes_used: 455460,
    inodes_limit: 600000,
    ram_mb: 418,
    sites_count: 17,
    sites_limit: 100,
    created_at: "2022-10-11",
    plan: "Business Web Hosting",
  };

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
        <Link href="/dashboard/plans">
          <Button variant="outline">Mejorar plan</Button>
        </Link>
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
                <p className="text-xs text-gray-500">Creado: {siteInfo.created_at}</p>
              </div>
            </div>
            <Link href={`/dashboard/domains/${siteId}/wordpress`}>
              <Button>
                Admin WordPress <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Quick action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/dashboard/domains/${siteId}`}>
              <Button variant="outline" size="sm"><Globe className="mr-1.5 h-3.5 w-3.5" /> Administrar dominio</Button>
            </Link>
            <Link href={`/dashboard/sites/${siteId}/config`}>
              <Button variant="outline" size="sm"><Settings className="mr-1.5 h-3.5 w-3.5" /> PHP & Config</Button>
            </Link>
            <Link href="/dashboard/mail">
              <Button variant="outline" size="sm"><span className="mr-1.5">✉</span> Administrar email</Button>
            </Link>
          </div>

          {/* Status badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> Malware protegido
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <Zap className="h-3 w-3" /> LiteSpeed
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3" /> SSL
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              CDN
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Site Health */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Salud del sitio</h3>
              <Badge variant="warning">Acción necesaria</Badge>
            </div>
            <Link href={`/dashboard/domains/${siteId}/wordpress`}>
              <Button variant="outline" size="sm">Ver detalles</Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Versión de WordPress</p>
              <p className="font-semibold text-gray-900">{siteInfo.wp_version}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Versión PHP</p>
              <p className="font-semibold text-gray-900">{siteInfo.php_version}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vulnerabilidades</p>
              <p className="font-semibold text-green-600">{siteInfo.vulnerabilities}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Tema activo</p>
              <p className="text-sm font-medium text-gray-900">{siteInfo.theme}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Plugins</p>
              <p className="text-sm font-medium text-gray-900">
                <span className="text-brand-600">{siteInfo.updates_available} actualizaciones</span> disponibles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Essentials */}
        <Card>
          <CardHeader>
            <CardTitle>Esenciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            <EssentialItem
              icon={Database}
              title="Base de datos"
              subtitle="Administrar base de datos"
              href="/dashboard/settings"
              action="Administrar"
            />
            <EssentialItem
              icon={HardDrive}
              title="Copias de seguridad"
              subtitle="Diariamente"
              href="/dashboard/backups"
            />
            <EssentialItem
              icon={FolderOpen}
              title="Administrador de archivos"
              subtitle="Edita tus archivos"
              href="#"
              action="Abrir"
            />
            <EssentialItem
              icon={RefreshCw}
              title="Caché"
              subtitle="Ver los cambios más recientes"
              href={`/dashboard/domains/${siteId}/wordpress`}
              action="Borrar caché"
            />
            <div className="border-t border-gray-100 px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Plan de hosting</p>
                  <p className="text-xs text-gray-500">{siteInfo.plan}</p>
                </div>
                <Link href="/dashboard/plans">
                  <span className="text-xs font-medium text-brand-600 hover:text-brand-700">›</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Uso de recursos</CardTitle>
              <Link href="/dashboard/metrics">
                <Button variant="outline" size="sm">Ver detalles</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Disk usage gauge */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray={`${(siteInfo.disk_used_mb / siteInfo.disk_limit_mb) * 100}, 100`} />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Uso del disco</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatBytes(siteInfo.disk_used_mb)} <span className="text-sm font-normal text-gray-500">/ {formatBytes(siteInfo.disk_limit_mb)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">CPU</p>
                <p className="text-sm font-bold text-gray-900">{siteInfo.cpu_percent} %</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Memoria</p>
                <p className="text-sm font-bold text-gray-900">{siteInfo.ram_mb} MB</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Inodos</p>
                <p className="text-sm font-bold text-gray-900">{(siteInfo.inodes_used / 1000).toFixed(0)}K <span className="text-xs font-normal text-gray-500">/ {(siteInfo.inodes_limit / 1000).toFixed(0)}K</span></p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Sitios web</p>
                <p className="text-sm font-bold text-gray-900">{siteInfo.sites_count} <span className="text-xs font-normal text-gray-500">/ {siteInfo.sites_limit}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EssentialItem({ icon: Icon, title, subtitle, href, action }: {
  icon: any; title: string; subtitle: string; href: string; action?: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {action && (
        <Link href={href}>
          <Button variant="outline" size="sm">{action}</Button>
        </Link>
      )}
    </div>
  );
}
