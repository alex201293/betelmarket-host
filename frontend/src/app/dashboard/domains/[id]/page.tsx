"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, Lock, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import type { Subdomain } from "@/types";

export default function DomainDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const domainId = params.id as string;
  const queryClient = useQueryClient();
  const [newSubdomain, setNewSubdomain] = useState("");

  const { data: domain } = useQuery({
    queryKey: ["domain", domainId],
    queryFn: async () => {
      const { data } = await api.get("/domains");
      return data.data?.find((d: any) => d.id === parseInt(domainId));
    },
  });

  const { data: subdomainsData, isLoading } = useQuery({
    queryKey: ["subdomains", domainId],
    queryFn: async () => {
      const { data } = await api.get(`/subdomains?domain_id=${domainId}`);
      return data;
    },
  });

  const enableSsl = useMutation({
    mutationFn: async () => {
      await api.post(`/domains/${domainId}/ssl/enable`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain", domainId] });
      toast.success(t.domains.enableSuccess);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const createSubdomain = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/subdomains", {
        domain_id: parseInt(domainId),
        subdomain: newSubdomain,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subdomains", domainId] });
      toast.success(t.domains.subdomainCreateSuccess);
      setNewSubdomain("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteSubdomain = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/subdomains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subdomains", domainId] });
      toast.success(t.domains.subdomainDeleteSuccess);
    },
  });

  const subdomains: Subdomain[] = subdomainsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/domains">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {domain?.domain || t.common.loading}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t.domains.subtitle}</p>
        </div>
      </div>

      {/* SSL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t.domains.sslCertificate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={domain?.ssl_enabled ? "success" : "secondary"}>
                {domain?.ssl_enabled ? t.common.active : t.common.inactive}
              </Badge>
              <span className="text-sm text-gray-500">
                {domain?.ssl_enabled ? t.domains.sslActive : t.domains.sslInactive}
              </span>
            </div>
            {!domain?.ssl_enabled && (
              <Button onClick={() => enableSsl.mutate()} disabled={enableSsl.isPending}>
                {enableSsl.isPending ? t.domains.enabling : t.domains.enableSsl}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WordPress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 1.5c4.687 0 8.5 3.813 8.5 8.5 0 4.687-3.813 8.5-8.5 8.5-4.687 0-8.5-3.813-8.5-8.5 0-4.687 3.813-8.5 8.5-8.5zM4.5 12l2.4 6.6L4.5 12zm3.6 0L12 18.6 8.1 12zm7.8 0L12 18.6 15.9 12zm-7.8 0l3.9-6.6L8.1 12zm7.8 0l-3.9-6.6L15.9 12z"/></svg>
            WordPress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Install or manage WordPress for this domain.</p>
            <Link href={`/dashboard/domains/${domainId}/wordpress`}>
              <Button variant="outline">
                Admin WordPress
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Subdomains */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.domains.subdomains}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); createSubdomain.mutate(); }} className="flex gap-2">
            <Input placeholder={t.domains.subdomainPlaceholder} value={newSubdomain}
              onChange={(e) => setNewSubdomain(e.target.value)} required className="max-w-xs" />
            <span className="flex items-center text-sm text-gray-500">.{domain?.domain}</span>
            <Button type="submit" disabled={createSubdomain.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              {createSubdomain.isPending ? t.domains.addingSubdomain : t.domains.addSubdomain}
            </Button>
          </form>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : subdomains.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">{t.domains.noSubdomains}</p>
          ) : (
            <div className="space-y-2">
              {subdomains.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-sm text-gray-900 dark:text-white">{sub.full_domain}</span>
                    <Badge variant={sub.status === "active" ? "success" : "warning"} className="text-xs">
                      {sub.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSubdomain.mutate(sub.id)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
