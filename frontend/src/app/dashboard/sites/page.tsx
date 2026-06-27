"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe, ExternalLink, Plus, CheckCircle2, Shield, Zap, Lock, Clock, Link2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Domain } from "@/types";

export default function SitesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data } = await api.get("/domains");
      return data;
    },
  });

  const createTempDomain = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/temp-domains", { hosting_account_id: 1 });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success(`Temporary domain created: ${data.domain?.domain || "ready"}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const domains: Domain[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sitios Web</h1>
          <p className="mt-1 text-sm text-gray-500">Administra tus sitios web, WordPress y recursos.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => createTempDomain.mutate()} variant="outline" disabled={createTempDomain.isPending}>
            <Clock className="mr-2 h-4 w-4" />
            {createTempDomain.isPending ? "Creating..." : "Dominio temporal"}
          </Button>
          <Link href="/dashboard/domains/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Agregar sitio</Button>
          </Link>
        </div>
      </div>

      {/* Sites list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : domains.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Globe className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No tienes sitios web aún.</p>
              <Link href="/dashboard/domains/new">
                <Button className="mt-4">Agregar tu primer sitio</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          domains.map((domain) => (
            <Link key={domain.id} href={`/dashboard/sites/${domain.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50">
                        <Globe className="h-6 w-6 text-brand-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{domain.domain}</p>
                          <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-brand-600" />
                          </a>
                        </div>
                        {/* Status badges */}
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          {(domain as any).is_temporary && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3" /> Temporal
                            </span>
                          )}
                          {domain.ssl_enabled && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <Lock className="h-3 w-3" /> SSL
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Zap className="h-3 w-3" /> LiteSpeed
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            <Shield className="h-3 w-3" /> Protected
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={domain.status === "active" ? "success" : "warning"}>
                        {domain.status}
                      </Badge>
                      {(domain as any).is_temporary ? (
                        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                          <Link2 className="mr-1 h-3 w-3" /> Conectar dominio
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                          Panel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
