"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Shield, Mail, Globe, Ban, CheckCircle2, XCircle, Lock, Key, Fingerprint, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function SecurityPage() {
  const queryClient = useQueryClient();
  const [banIpValue, setBanIpValue] = useState("");
  const [dmarcEmail, setDmarcEmail] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("1");

  // Mock security status
  const securityStatus = {
    antispam_enabled: true,
    antivirus_enabled: true,
    dkim_enabled: true,
    spf_configured: true,
    dmarc_configured: false,
    force_https: true,
    hsts_enabled: false,
  };

  const bannedIps = [
    { ip: "185.220.101.34", reason: "Brute force SSH", date: "2024-10-20" },
    { ip: "92.118.160.5", reason: "Spam relay attempt", date: "2024-10-21" },
  ];

  const toggleAntispam = useMutation({
    mutationFn: async (enable: boolean) => {
      const action = enable ? "enable" : "disable";
      await api.post(`/security/mail/${selectedDomain}/antispam/${action}`);
    },
    onSuccess: () => toast.success("Antispam setting updated"),
  });

  const toggleAntivirus = useMutation({
    mutationFn: async (enable: boolean) => {
      const action = enable ? "enable" : "disable";
      await api.post(`/security/mail/${selectedDomain}/antivirus/${action}`);
    },
    onSuccess: () => toast.success("Antivirus setting updated"),
  });

  const enableDkim = useMutation({
    mutationFn: () => api.post(`/security/mail/${selectedDomain}/dkim/enable`),
    onSuccess: () => toast.success("DKIM enabled"),
  });

  const configureSpf = useMutation({
    mutationFn: () => api.post(`/security/mail/${selectedDomain}/spf`),
    onSuccess: () => toast.success("SPF record configured"),
  });

  const configureDmarc = useMutation({
    mutationFn: () => api.post(`/security/mail/${selectedDomain}/dmarc`, { email: dmarcEmail }),
    onSuccess: () => { toast.success("DMARC configured"); setDmarcEmail(""); },
  });

  const banIp = useMutation({
    mutationFn: () => api.post("/security/firewall/ban", { ip: banIpValue }),
    onSuccess: () => { toast.success(`IP ${banIpValue} banned`); setBanIpValue(""); },
    onError: () => toast.error("Failed to ban IP"),
  });

  const unbanIp = useMutation({
    mutationFn: (ip: string) => api.post("/security/firewall/unban", { ip }),
    onSuccess: () => toast.success("IP unbanned"),
  });

  const forceHttps = useMutation({
    mutationFn: () => api.post(`/security/web/${selectedDomain}/force-https`),
    onSuccess: () => toast.success("HTTPS forced"),
  });

  const enableHsts = useMutation({
    mutationFn: () => api.post(`/security/web/${selectedDomain}/hsts`),
    onSuccess: () => toast.success("HSTS enabled"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="mt-1 text-sm text-gray-500">Manage email security, firewall, and web protection.</p>
      </div>

      {/* ─── EMAIL SECURITY ──────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-600" /> Email Security (Anti-Spam)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Protect your mailboxes from spam, viruses, and spoofing attacks.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Antispam */}
            <SecurityToggle
              icon={ShieldAlert}
              title="SpamAssassin"
              description="Filters incoming spam email"
              enabled={securityStatus.antispam_enabled}
              onToggle={(v) => toggleAntispam.mutate(v)}
            />

            {/* Antivirus */}
            <SecurityToggle
              icon={Shield}
              title="ClamAV Antivirus"
              description="Scans attachments for malware"
              enabled={securityStatus.antivirus_enabled}
              onToggle={(v) => toggleAntivirus.mutate(v)}
            />

            {/* DKIM */}
            <SecurityToggle
              icon={Fingerprint}
              title="DKIM Signing"
              description="Authenticates outgoing emails"
              enabled={securityStatus.dkim_enabled}
              onToggle={() => enableDkim.mutate()}
            />

            {/* SPF */}
            <SecurityToggle
              icon={CheckCircle2}
              title="SPF Record"
              description="Prevents email spoofing"
              enabled={securityStatus.spf_configured}
              onToggle={() => configureSpf.mutate()}
            />
          </div>

          {/* DMARC */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">DMARC Policy</p>
                  <p className="text-xs text-gray-500">Tells receivers what to do with failed auth</p>
                </div>
              </div>
              <Badge variant={securityStatus.dmarc_configured ? "success" : "warning"}>
                {securityStatus.dmarc_configured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            {!securityStatus.dmarc_configured && (
              <div className="mt-3 flex gap-2">
                <Input placeholder="Report email (admin@domain.com)" value={dmarcEmail} onChange={(e) => setDmarcEmail(e.target.value)} className="max-w-xs" />
                <Button size="sm" onClick={() => configureDmarc.mutate()} disabled={!dmarcEmail}>Configure</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── WEB SECURITY ───────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-600" /> Web Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <SecurityToggle
              icon={Lock}
              title="Force HTTPS"
              description="Redirect all HTTP to HTTPS"
              enabled={securityStatus.force_https}
              onToggle={() => forceHttps.mutate()}
            />
            <SecurityToggle
              icon={Shield}
              title="HSTS Header"
              description="Strict transport security"
              enabled={securityStatus.hsts_enabled}
              onToggle={() => enableHsts.mutate()}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── FIREWALL ───────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" /> Firewall & IP Blocking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ban IP form */}
          <div className="flex gap-2">
            <Input placeholder="IP address to ban (e.g., 192.168.1.1)" value={banIpValue} onChange={(e) => setBanIpValue(e.target.value)} className="max-w-xs" />
            <Button variant="destructive" size="sm" onClick={() => banIp.mutate()} disabled={!banIpValue || banIp.isPending}>
              <Ban className="mr-1 h-3 w-3" /> Ban IP
            </Button>
          </div>

          {/* Banned list */}
          <div className="rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">IP Address</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Reason</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bannedIps.map((entry) => (
                  <tr key={entry.ip} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-sm text-gray-900">{entry.ip}</td>
                    <td className="px-4 py-2.5 text-gray-600">{entry.reason}</td>
                    <td className="px-4 py-2.5 text-gray-500">{entry.date}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => unbanIp.mutate(entry.ip)}>
                        Unban
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bannedIps.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">No banned IPs.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-brand-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Security Best Practices</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li><strong>SPF + DKIM + DMARC</strong> — Prevents your emails from going to spam</li>
                <li><strong>SpamAssassin</strong> — Filters 95%+ of incoming spam</li>
                <li><strong>ClamAV</strong> — Blocks malware in email attachments</li>
                <li><strong>Force HTTPS + HSTS</strong> — Ensures all connections are encrypted</li>
                <li><strong>Fail2Ban</strong> — Automatically bans IPs after failed login attempts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityToggle({ icon: Icon, title, description, enabled, onToggle }: {
  icon: any; title: string; description: string; enabled: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
