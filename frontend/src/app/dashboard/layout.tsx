"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useHydrateLanguage } from "@/stores/language";
import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationsDropdown } from "@/components/dashboard/notifications-dropdown";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { Search } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, fetchUser, isLoading } = useAuthStore();
  const router = useRouter();
  const hydrated = useHydrateLanguage();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) {
      fetchUser();
    }
  }, [token, user, fetchUser, router]);

  if (!token || isLoading || !hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar - Hostinger style */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NotificationsDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
