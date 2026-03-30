"use client";

import { useState } from "react";
import { HardDrive, Star, ChevronLeft, ChevronRight } from "lucide-react";

export type DashboardView = "files" | "favourites";

type SidebarItem = {
  id: DashboardView;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const ITEMS: SidebarItem[] = [
  { id: "files", label: "My Files", Icon: HardDrive },
  { id: "favourites", label: "Favourites", Icon: Star },
];

type DashboardSidebarProps = {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
};

export function DashboardSidebar({ activeView, onViewChange }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`shrink-0 transition-all duration-200 ${collapsed ? "w-14" : "w-48"}`}
    >
      <div className="ice-glass-frost rounded-2xl p-2 sticky top-6">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-full flex items-center justify-end p-2 mb-1 text-white/30 hover:text-white/60 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <nav className="space-y-0.5">
          {ITEMS.map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  active
                    ? "bg-white/[0.08] text-white/90"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${id === "favourites" && active ? "fill-yellow-300/70 text-yellow-300/70" : ""}`}
                  strokeWidth={1.5}
                />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
