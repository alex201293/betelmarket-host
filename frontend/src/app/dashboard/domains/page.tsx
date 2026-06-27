"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, Plus, Trash2, Lock, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { Domain } from "@/types";

export default function DomainsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [domain, setDomain] = useState("");
  const [hostingAccountId, setHostingAccountId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data } = await api.get("/domains");
      return data;
    },
  });

  const createDomain = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/domains", {
        hosting_account_id: parseInt(hostingAccountId),
        domain,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success(t.domains.createSuccess);
      setShowCreate(false);
      setDomain("");
      setHostingAccountId("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t.domains.createError);
    },
  });

  const deleteDomain = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      toast.success(t.domains.deleteSuccess);
    },
  });

  const domains: Domain[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.domains.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.domains.subtitle}</p>
        </div>
        <Link href="/dashboard/domains/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t.domains.addDomain}
          </Button>
        </Link>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDomain.mutate();
              }}
              className="grid gap-4 sm:grid-cols-3"
            >
              <Input
                placeholder={t.domains.domainPlaceholder}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
              <Input
                placeholder={t.domains.hostingAccountId}
                type="number"
                value={hostingAccountId}
                onChange={(e) => setHostingAccountId(e.target.value)}
                required
              />
              <Button type="submit" disabled={createDomain.isPending}>
                {createDomain.isPending ? t.domains.adding : t.domains.addDomain}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : domains.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            {t.domains.noDomains}
          </div>
        ) : (
          domains.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                      <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {d.domain}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant={d.status === "active" ? "success" : "warning"}
                        >
                          {d.status}
                        </Badge>
                        {d.ssl_enabled && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Lock className="h-3 w-3" /> {t.domains.ssl}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDomain.mutate(d.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Link href={`/dashboard/domains/${d.id}`} className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <ExternalLink className="mr-1 h-3 w-3" /> {t.domains.manageSubdomains}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
