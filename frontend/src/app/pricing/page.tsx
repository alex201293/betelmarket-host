"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Database } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import type { Plan } from "@/types";

export default function PricingPage() {
  const { t } = useTranslation();

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data } = await api.get("/plans/public");
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-brand-600" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">BetelMarket</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost">{t.pricing.signIn}</Button>
            </Link>
            <Link href="/register">
              <Button>{t.pricing.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
          {t.pricing.heroTitle}
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {t.pricing.heroSubtitle}
        </p>
      </section>

      {/* Plans Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {(plans || []).map((plan, index) => (
              <Card key={plan.id} className={index === 1 ? "relative border-brand-500 shadow-lg ring-2 ring-brand-500" : ""}>
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-brand-600 text-white">{t.pricing.mostPopular}</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                    <span className="text-gray-500">{t.pricing.perMonth}</span>
                  </div>

                  <Link href="/register" className="mt-6 block">
                    <Button className="w-full" variant={index === 1 ? "default" : "outline"}>
                      {t.pricing.getStarted}
                    </Button>
                  </Link>

                  <ul className="mt-8 space-y-3">
                    <Feature text={`${plan.max_domains} ${plan.max_domains > 1 ? t.pricing.domains : t.pricing.domain}`} />
                    <Feature text={`${plan.max_subdomains} ${plan.max_subdomains > 1 ? t.pricing.subdomains : t.pricing.subdomain}`} />
                    <Feature text={`${plan.max_mailboxes} ${plan.max_mailboxes > 1 ? t.pricing.emailAccounts : t.pricing.emailAccount}`} />
                    <Feature text={`${formatBytes(plan.disk_quota_mb)} ${t.pricing.storage}`} />
                    <Feature text={`${formatBytes(plan.bandwidth_quota_mb)} ${t.pricing.bandwidth}`} />
                    <Feature text={`${plan.max_databases} ${plan.max_databases > 1 ? t.pricing.databases : t.pricing.database}`} />
                    <Feature text={t.pricing.freeSsl} />
                    <Feature text={t.pricing.dailyBackups} />
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
        <p className="text-center text-sm text-gray-500">
          {t.pricing.footer.replace("{year}", new Date().getFullYear().toString())}
        </p>
      </footer>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <Check className="h-4 w-4 text-green-500" />
      {text}
    </li>
  );
}
