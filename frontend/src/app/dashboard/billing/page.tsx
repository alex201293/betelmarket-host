"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, AlertTriangle, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface Invoice {
  id: number;
  invoice_number: string;
  total: string;
  status: string;
  issue_date: string;
  due_date: string;
  payment_method: string | null;
}

interface BillingSummary {
  total_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  total_invoices: number;
}

export default function BillingPage() {
  const { t } = useTranslation();

  const { data: summary } = useQuery<BillingSummary>({
    queryKey: ["billing-summary"],
    queryFn: async () => {
      const { data } = await api.get("/invoices/summary");
      return data;
    },
  });

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await api.get("/invoices");
      return data;
    },
  });

  const invoices: Invoice[] = invoicesData?.data || [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "paid": return "success" as const;
      case "overdue": return "destructive" as const;
      case "pending": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  const stats = [
    { name: t.billing.totalRevenue, value: `$${summary?.total_revenue?.toFixed(2) || "0.00"}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
    { name: t.billing.pending, value: `$${summary?.pending_amount?.toFixed(2) || "0.00"}`, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
    { name: t.billing.overdue, value: `$${summary?.overdue_amount?.toFixed(2) || "0.00"}`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
    { name: t.billing.invoices, value: summary?.total_invoices || 0, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.billing.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.billing.subtitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.billing.invoices}</CardTitle>
        </CardHeader>
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.billing.invoiceNumber}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.billing.amount}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.common.status}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.billing.issueDate}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t.billing.dueDate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        ${inv.total}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(inv.issue_date)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(inv.due_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && (
                <p className="py-8 text-center text-gray-500">{t.billing.noInvoices}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
