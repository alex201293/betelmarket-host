"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, children, className }: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "");
  const active = activeTab ?? internalActive;
  const setActive = onTabChange ?? setInternalActive;

  return (
    <div className={cn("w-full text-gray-900", className)}>
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              active === tab.id
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;
  return <div>{children}</div>;
}
