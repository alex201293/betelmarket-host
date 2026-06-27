"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Key, User, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, fetchUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [apiKeyName, setApiKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  const { data: apiKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data } = await api.get("/settings/api-keys");
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      await api.patch("/settings/profile", profileForm);
    },
    onSuccess: () => {
      fetchUser();
      toast.success(t.settings.profileSuccess);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t.settings.profileError),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      await api.post("/settings/change-password", passwordForm);
    },
    onSuccess: () => {
      toast.success(t.settings.passwordSuccess);
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t.settings.passwordError),
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/settings/api-keys", { name: apiKeyName });
      return data;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.token);
      setApiKeyName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(t.settings.keyGenerated);
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/settings/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(t.settings.revokeSuccess);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.settings.subtitle}</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {t.settings.profile}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.settings.nameLabel}</label>
              <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.settings.emailLabel}</label>
              <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? t.settings.saving : t.settings.saveChanges}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t.settings.changePassword}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }} className="grid gap-4 sm:grid-cols-3">
            <Input type="password" placeholder={t.settings.currentPassword} value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required />
            <Input type="password" placeholder={t.settings.newPassword} value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required />
            <Input type="password" placeholder={t.settings.confirmPassword} value={passwordForm.new_password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })} required />
            <div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? t.settings.changing : t.settings.changeBtn}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> {t.settings.apiKeys}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedKey && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <p className="mb-1 text-sm font-medium text-green-800 dark:text-green-200">{t.settings.newKeyWarning}</p>
              <code className="block break-all text-xs text-green-900 dark:text-green-100">{generatedKey}</code>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); generateKey.mutate(); }} className="flex gap-2">
            <Input placeholder={t.settings.keyNamePlaceholder} value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} required className="max-w-xs" />
            <Button type="submit" disabled={generateKey.isPending}>
              {generateKey.isPending ? t.settings.generating : t.settings.generateKey}
            </Button>
          </form>

          {/* Existing keys */}
          <div className="space-y-2">
            {(apiKeys || []).map((key: any) => (
              <div key={key.id} className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.settings.lastUsed} {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : t.settings.never}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => revokeKey.mutate(key.id)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
