"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { User } from "@/types";

export default function ClientsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" });

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/users");
      return data;
    },
  });

  const createUser = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { data } = await api.post("/users", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t.clients.createSuccess);
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "client" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t.clients.createError);
    },
  });

  const suspendUser = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/users/${id}`, { status: "suspended" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t.clients.suspendSuccess);
    },
  });

  const users: User[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.clients.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.clients.subtitle}</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t.clients.addClient}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUser.mutate(form);
              }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Input
                placeholder={t.clients.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder={t.clients.emailPlaceholder}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                placeholder={t.clients.passwordPlaceholder}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? t.clients.creating : t.common.create}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.common.name}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.common.email}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.clients.role}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.common.status}</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.status === "active" ? "success" : "destructive"}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => suspendUser.mutate(user.id)}
                          >
                            {t.clients.suspend}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="py-8 text-center text-gray-500">{t.clients.noClients}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
