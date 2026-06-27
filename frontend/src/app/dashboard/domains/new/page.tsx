"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, CheckCircle2, Copy, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Step = "create" | "dns" | "verify";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl: number;
}

export default function NewDomainWizardPage() {
  const [step, setStep] = useState<Step>("create");
  const [domain, setDomain] = useState("");
  const [hostingAccountId, setHostingAccountId] = useState("");
  const [createdDomain, setCreatedDomain] = useState<any>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Fetch hosting accounts to auto-select
  const { data: hostingData } = useQuery({
    queryKey: ["hosting-accounts"],
    queryFn: async () => {
      const { data } = await api.get("/hosting");
      return data;
    },
  });

  // Auto-select first active account
  const accounts = hostingData?.data || [];
  if (!hostingAccountId && accounts.length > 0) {
    const active = accounts.find((a: any) => a.status === "active");
    if (active) setHostingAccountId(String(active.id));
  }

  const createDomain = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/wizard/domain", {
        hosting_account_id: parseInt(hostingAccountId),
        domain,
      });
      return data;
    },
    onSuccess: (data) => {
      setCreatedDomain(data.domain || { domain, id: 1 });
      setDnsRecords(data.dns_records || [
        { type: "A", name: "@", value: "192.168.1.100", ttl: 3600 },
        { type: "A", name: "www", value: "192.168.1.100", ttl: 3600 },
        { type: "MX", name: "@", value: `mail.${domain}`, priority: 10, ttl: 3600 },
        { type: "A", name: "mail", value: "192.168.1.100", ttl: 3600 },
        { type: "TXT", name: "@", value: `v=spf1 a mx ip4:192.168.1.100 ~all`, ttl: 3600 },
      ]);
      setStep("dns");
      toast.success("Domain created! Now configure your DNS.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create domain"),
  });

  const verifyDns = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/wizard/domain/${createdDomain?.id || 1}/verify`);
      return data;
    },
    onSuccess: (data) => {
      setVerifyResult(data);
      if (data.all_valid) {
        toast.success("DNS verified! Your domain is ready.");
      } else {
        toast.error("DNS not propagated yet. Try again later.");
      }
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/domains">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Domain</h1>
          <p className="mt-1 text-sm text-gray-500">Follow the steps to connect your domain.</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        <StepBadge number={1} label="Create" active={step === "create"} completed={step !== "create"} />
        <div className="h-px flex-1 bg-gray-200" />
        <StepBadge number={2} label="DNS Setup" active={step === "dns"} completed={step === "verify"} />
        <div className="h-px flex-1 bg-gray-200" />
        <StepBadge number={3} label="Verify" active={step === "verify"} completed={false} />
      </div>

      {/* Step 1: Create */}
      {step === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Enter your domain name</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createDomain.mutate(); }} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Domain</label>
                <Input
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">Enter your domain without www or https://</p>
              </div>
              <Button type="submit" disabled={createDomain.isPending || !domain}>
                {createDomain.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: DNS */}
      {step === "dns" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure DNS Records</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Go to your domain registrar and add these DNS records:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Type</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Value</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Priority</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dnsRecords.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5"><Badge variant="secondary">{r.type}</Badge></td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{r.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700 max-w-[200px] truncate">{r.value}</td>
                      <td className="px-4 py-2.5 text-gray-500">{r.priority || "—"}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => copyToClipboard(r.value)} className="text-gray-400 hover:text-brand-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium">DNS propagation can take 1-48 hours.</p>
              <p className="mt-1 text-blue-600">You can proceed to verify once you&apos;ve made the changes at your registrar.</p>
            </div>

            <Button onClick={() => setStep("verify")}>
              I&apos;ve configured my DNS <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Verify */}
      {step === "verify" && (
        <Card>
          <CardHeader>
            <CardTitle>Verify DNS Propagation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Click verify to check if your DNS records have propagated correctly for <strong>{domain}</strong>.
            </p>

            <Button onClick={() => verifyDns.mutate()} disabled={verifyDns.isPending}>
              {verifyDns.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
              ) : (
                "Verify DNS"
              )}
            </Button>

            {verifyResult && (
              <div className="mt-4 space-y-2">
                {verifyResult.checks?.map((check: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{check.type}</p>
                      <p className="text-xs text-gray-500">Expected: {check.expected}</p>
                    </div>
                    {check.valid ? (
                      <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Verified</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                ))}

                {verifyResult.all_valid ? (
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-2 font-semibold text-green-800">Domain verified!</p>
                    <Link href="/dashboard/domains">
                      <Button className="mt-3">Go to Domains</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Not all records have propagated. Try again in a few minutes.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepBadge({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
        completed ? "bg-green-100 text-green-700" :
        active ? "bg-brand-100 text-brand-700" :
        "bg-gray-100 text-gray-400"
      }`}>
        {completed ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>
      <span className={`text-xs font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}
