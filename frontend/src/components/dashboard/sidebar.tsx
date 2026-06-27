"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  Globe,
  Mail,
  Shield,
  HardDrive,
  Settings,
  CreditCard,
  Package,
  LogOut,
  Users,
  Activity,
  FileText,
  ArrowRightLeft,
  ShieldCheck,
  Monitor,
  Terminal,
  FolderUp,
  FolderOpen,
  Database,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const mainNav = [
    { name: t.sidebar.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: "Sitios web", href: "/dashboard/sites", icon: Monitor },
    { name: t.sidebar.domains, href: "/dashboard/domains", icon: Globe },
    { name: t.sidebar.emails, href: "/dashboard/mail", icon: Mail },
    { name: "Apps", href: "/dashboard/apps", icon: Terminal },
  ];

  const managementNav = [
    { name: t.sidebar.clients, href: "/dashboard/clients", icon: Users, roles: ["super_admin", "reseller"] },
    { name: t.sidebar.plans, href: "/dashboard/plans", icon: Package, roles: ["super_admin"] },
    { name: t.sidebar.dns, href: "/dashboard/dns", icon: Shield },
    { name: "Databases", href: "/dashboard/databases", icon: Database },
    { name: "Files", href: "/dashboard/files", icon: FolderOpen },
    { name: "FTP", href: "/dashboard/ftp", icon: FolderUp },
    { name: t.sidebar.backups, href: "/dashboard/backups", icon: HardDrive },
    { name: "Migration", href: "/dashboard/migrations", icon: ArrowRightLeft },
    { name: t.sidebar.billing, href: "/dashboard/billing", icon: CreditCard },
  ];

  const adminNav = [
    { name: t.sidebar.metrics, href: "/dashboard/metrics", icon: Activity, roles: ["super_admin"] },
    { name: "Quotas", href: "/dashboard/quotas", icon: HardDrive, roles: ["super_admin"] },
    { name: "Security", href: "/dashboard/security", icon: ShieldCheck },
    { name: t.sidebar.auditLog, href: "/dashboard/audit", icon: FileText, roles: ["super_admin"] },
    { name: t.sidebar.settings, href: "/dashboard/settings", icon: Settings },
  ];

  const filterByRole = (items: typeof managementNav) =>
    items.filter((item) => {
      if (!("roles" in item) || !item.roles) return true;
      return user && item.roles.includes(user.role);
    });

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <img
          src="/images/logo-betelmarket.png"
          alt="BetelMarket"
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {/* Main */}
        <div className="space-y-0.5">
          {filterByRole(mainNav).map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Management section */}
        <div className="space-y-0.5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Management
          </p>
          {filterByRole(managementNav).map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Admin section */}
        <div className="space-y-0.5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Admin
          </p>
          {filterByRole(adminNav).map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.name}
            </p>
            <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t.sidebar.logout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, pathname }: { item: { name: string; href: string; icon: any }; pathname: string }) {
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <item.icon className={cn("h-[16px] w-[16px]", isActive ? "text-brand-600" : "text-gray-400")} />
      {item.name}
    </Link>
  );
}
