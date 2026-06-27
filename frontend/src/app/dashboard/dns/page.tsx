"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { DnsRecord } from "@/types";

export default function DnsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    domain_id: "",
    type: "A",
    name: "",
    value: "",
    ttl: "3600",
    priority: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dns"],
    queryFn: async () => {
      const { data } = await api.get("/dns");
      return data;
    },
  });

  const createRecord = useMutation({
    mutationFn: async () => {
      const payload: any = {
        domain_id: parseInt(form.domain_id),
        type: form.type,
        name: form.name,
        value: form.value,
        ttl: parseInt(form.ttl),
      };
      if (form.priority) payload.priority = parseInt(form.priority);
      const { data } = await api.post("/dns", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dns"] });
      toast.success(t.dns.createSuccess);
      setShowCreate(false);
      setForm({ domain_id: "", type: "A", name: "", value: "", ttl: "3600", priority: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t.dns.createError);
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dns"] });
      toast.success(t.dns.deleteSuccess);
    },
  });

  const records: DnsRecord[] = data?.data || [];

  const recordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.dns.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.dns.subtitle}</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          {t.dns.addRecord}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRecord.mutate();
              }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
            >
              <Input
                placeholder={t.dns.domainId}
                type="number"
                value={form.domain_id}
                onChange={(e) => setForm({ ...form, domain_id: e.target.value })}
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {recordTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                placeholder={t.dns.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder={t.dns.valuePlaceholder}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
              <Input
                placeholder={t.dns.ttl}
                type="number"
                value={form.ttl}
                onChange={(e) => setForm({ ...form, ttl: e.target.value })}
              />
              <Button type="submit" disabled={createRecord.isPending}>
                {createRecord.isPending ? t.dns.adding : t.common.add}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.dns.type}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.dns.name}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.dns.value}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.dns.ttl}</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4">
                        <Badge variant="secondary">{record.type}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">
                        {record.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                        {record.value}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{record.ttl}s</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecord.mutate(record.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {records.length === 0 && (
                <p className="py-8 text-center text-gray-500">{t.dns.noRecords}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
