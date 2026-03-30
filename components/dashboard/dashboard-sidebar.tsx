"use client";

import { useState } from "react";
import { HardDrive, Star, ChevronLeft, ChevronRight, Shield, LogOut } from "lucide-react";

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
  userId: string;
  onLogout: () => void;
};

export function DashboardSidebar({ activeView, onViewChange, userId, onLogout }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`shrink-0 h-screen sticky top-0 flex flex-col transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex flex-col h-full ice-glass-frost border-r border-white/[0.05]">

        {/* Logo */}
        <div className={`flex items-center gap-3 border-b border-white/[0.05] ${collapsed ? "justify-center p-4" : "px-4 py-4"}`}>
          <div className="w-8 h-8 rounded-lg ice-glass-deep flex items-center justify-center shrink-0 border border-white/[0.08]">
            <Shield className="w-4 h-4 text-blue-300/80" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-white/90">CITADELLE</p>
              <p className="text-[10px] text-blue-200/35 tracking-widest">Secure Storage</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[9px] font-medium text-white/20 tracking-[0.18em] uppercase px-3 mb-3">
              Storage
            </p>
          )}
          {ITEMS.map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
                  collapsed ? "justify-center p-3" : "px-3 py-2.5"
                } ${
                  active
                    ? "bg-white/[0.08] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    id === "favourites" && active
                      ? "fill-yellow-300/60 text-yellow-300/60"
                      : active
                      ? "text-blue-300/80"
                      : ""
                  }`}
                  strokeWidth={1.5}
                />
                {!collapsed && (
                  <span className="text-sm font-medium">{label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/[0.05] p-2 space-y-1">
          {/* Encryption badge */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.1]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
              <span className="text-[10px] text-emerald-300/45 tracking-wide leading-none">
                End-to-End Encrypted
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-1" title="End-to-End Encrypted">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
            </div>
          )}

          {/* User row */}
          <div className={`flex items-center gap-2.5 rounded-xl px-2 py-2 ${collapsed ? "justify-center flex-col gap-1.5" : ""}`}>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-400/15 flex items-center justify-center shrink-0">
              <span className="text-[10px] text-blue-300/50 font-mono font-semibold">
                {userId.slice(0, 2).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <p className="flex-1 text-xs text-white/30 font-mono truncate min-w-0">
                {userId.slice(0, 8)}&hellip;
              </p>
            )}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-white/20 hover:text-white/55 hover:bg-white/[0.05] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center justify-center py-2.5 text-white/15 hover:text-white/40 transition-colors border-t border-white/[0.04] hover:bg-white/[0.02]"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
}
