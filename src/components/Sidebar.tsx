"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Globe,
  Bot,
  List,
} from "lucide-react";

const BUILD_ITEMS = [
  { icon: Globe, label: "Overview", href: "/" },
  { icon: Bot, label: "Agents", href: "/" },
];

const MONITOR_ITEMS = [{ icon: List, label: "Call Logs", href: "/call-logs" }];

function NavSection({
  title,
  items,
  collapsed,
  pathname,
}: {
  title: string;
  items: { icon: typeof Globe; label: string; href: string }[];
  collapsed: boolean;
  pathname: string | null;
}) {
  return (
    <div className="py-2">
      {!collapsed && (
        <p className="px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map(({ icon: Icon, label, href }) => {
          // On home ("/") only highlight Agents, not Overview
          const isActive =
            href !== "#" &&
            pathname === href &&
            (pathname !== "/" || label === "Agents");
          const content = (
            <>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </>
          );
          const className = `flex items-center gap-3 w-full py-2.5 rounded-lg text-sm transition-colors ${
            collapsed ? "justify-center px-0" : "px-3"
          } ${
            isActive
              ? "bg-white/10 text-white"
              : "text-muted hover:text-white hover:bg-white/5"
          }`;
          if (href === "#") {
            return (
              <button
                key={label}
                className={className}
                title={collapsed ? label : undefined}
              >
                {content}
              </button>
            );
          }
          return (
            <Link
              key={label}
              href={href}
              className={className}
              title={collapsed ? label : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-border transition-[width] duration-200 shrink-0 ${
        collapsed ? "w-[56px]" : "w-[240px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 h-14 px-3 border-b border-border shrink-0">
        {!collapsed && (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-emerald-500 text-white text-sm font-semibold shrink-0">
              SL
            </div>
            <span className="text-white font-medium truncate flex-1 min-w-0">
              Sleepycat
            </span>
            <button
              type="button"
              className="p-1.5 rounded text-muted hover:text-white hover:bg-white/5"
              aria-label="Sort or menu"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors shrink-0 ${
            collapsed ? "mx-auto" : "ml-0"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 min-h-0">
        <NavSection
          title="Build"
          items={BUILD_ITEMS}
          collapsed={collapsed}
          pathname={pathname}
        />
        <NavSection
          title="Monitor"
          items={MONITOR_ITEMS}
          collapsed={collapsed}
          pathname={pathname}
        />
      </nav>
    </aside>
  );
}
