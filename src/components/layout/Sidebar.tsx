"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Building2,
  Bot,
  Truck,
  BarChart3,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/persistence/AppContext";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { state } = useApp();

  const pendingPlansCount = state.proposedPlans.filter(
    (p) => p.status === "pending_approval"
  ).length;

  const activeMissionsCount = state.missions.filter((m) =>
    ["approved", "pickup_confirmed"].includes(m.status)
  ).length;

  const navItems = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Surplus Inventory",
      href: "/inventory",
      icon: Boxes,
      badge: state.listings.filter((l) => l.status === "available").length,
    },
    {
      name: "Recipient Directory",
      href: "/recipients",
      icon: Building2,
      badge: state.recipients.filter((r) => r.isAvailable && r.isVerified).length,
    },
    {
      name: "AI Agent Control",
      href: "/agent",
      icon: Bot,
      badge: pendingPlansCount > 0 ? pendingPlansCount : undefined,
      badgeVariant: "lime",
    },
    {
      name: "Rescue Missions",
      href: "/missions",
      icon: Truck,
      badge: activeMissionsCount > 0 ? activeMissionsCount : undefined,
      badgeVariant: "forest",
    },
    {
      name: "Analytics & Impact",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <aside className="w-64 border-r border-surface-border bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-surface-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-forest-900 flex items-center justify-center text-white shadow-xs">
          <Leaf className="w-5 h-5 text-lime-accent" />
        </div>
        <div>
          <h1 className="font-bold text-forest-950 text-base leading-tight tracking-tight">
            RescueLoop<span className="text-lime-dark font-black">.ai</span>
          </h1>
          <p className="text-[11px] text-charcoal-subtle font-medium">
            Food Surplus Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-charcoal-subtle uppercase">
          Coordination Platform
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-forest-900 text-white shadow-xs"
                  : "text-charcoal hover:bg-forest-50 hover:text-forest-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-lime-accent" : "text-charcoal-muted"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-xs font-semibold rounded-md ${
                    isActive
                      ? "bg-white/20 text-white"
                      : item.badgeVariant === "lime"
                      ? "bg-lime-100 text-lime-900 font-bold"
                      : "bg-forest-100 text-forest-800"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operator Session Info */}
      <div className="p-4 border-t border-surface-border bg-surface-muted/50">
        <div className="flex items-center justify-between text-xs text-charcoal-muted mb-2">
          <span className="font-medium text-charcoal">Metro Regional Hub</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="text-[11px] text-charcoal-subtle">
          Coordinator: <span className="text-charcoal font-medium">Demo Dispatcher</span>
        </div>
        <div className="text-[10px] text-charcoal-subtle mt-1 font-mono">
          Model: {state.settings.geminiModel}
        </div>
      </div>
    </aside>
  );
};
