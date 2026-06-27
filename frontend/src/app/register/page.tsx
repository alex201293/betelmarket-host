"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t.auth.registerError
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900">
            <Database className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <CardTitle className="text-2xl">{t.auth.createAccount}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.auth.nameLabel}</label>
              <Input id="name" placeholder={t.auth.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.auth.emailLabel}</label>
              <Input id="email" type="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.auth.passwordLabel}</label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t.auth.registering : t.auth.registerBtn}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="text-brand-600 hover:underline dark:text-brand-400">{t.auth.signInLink}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
