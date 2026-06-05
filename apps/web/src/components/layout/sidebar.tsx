"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@plani/ui";

type Project = { id: string; name: string; color: string };
type Workspace = { id: string; name: string };

interface SidebarProps {
  workspace: Workspace | null;
  projects: Project[];
}

export function Sidebar({ workspace, projects }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  const navItems = [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }];

  const workspaceItems = [
    { href: "/settings/members", icon: Users, label: "Membres" },
    { href: "/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <aside
      className={cn(
        "flex flex-shrink-0 flex-col border-r transition-all duration-200",
        collapsed ? "w-12" : "w-56",
      )}
      style={{
        borderColor: "var(--color-border-subtle)",
        backgroundColor: "var(--color-bg-sidebar)",
      }}
    >
      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2 pt-3">
        {!collapsed && (
          <p
            className="mb-1 px-2 text-[10px] tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Navigation
          </p>
        )}
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              collapsed && "justify-center",
            )}
            style={{
              backgroundColor: pathname === href ? "var(--color-accent-subtle)" : undefined,
              color: pathname === href ? "var(--color-accent)" : "var(--color-text-secondary)",
            }}
            title={collapsed ? label : undefined}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      <div className="mx-2 my-2 border-t" style={{ borderColor: "var(--color-border-subtle)" }} />

      {/* Projects */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {!collapsed && (
          <p
            className="mb-1 px-2 text-[10px] tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Projets
          </p>
        )}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}/board`}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              collapsed && "justify-center",
            )}
            style={{
              backgroundColor: pathname.startsWith(`/projects/${project.id}`)
                ? "var(--color-accent-subtle)"
                : undefined,
              color: pathname.startsWith(`/projects/${project.id}`)
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            }}
            title={collapsed ? project.name : undefined}
          >
            <span
              className="h-2 w-2 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
            {!collapsed && <span className="truncate">{project.name}</span>}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
            collapsed && "justify-center",
          )}
          style={{ color: "var(--color-text-muted)" }}
          title={collapsed ? "Nouveau projet" : undefined}
        >
          <Plus size={13} className="flex-shrink-0" />
          {!collapsed && "Nouveau projet"}
        </Link>
      </nav>

      <div className="mx-2 border-t" style={{ borderColor: "var(--color-border-subtle)" }} />

      {/* Workspace */}
      <nav className="flex flex-col gap-0.5 p-2">
        {workspaceItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              collapsed && "justify-center",
            )}
            style={{
              backgroundColor: pathname === href ? "var(--color-accent-subtle)" : undefined,
              color: pathname === href ? "var(--color-accent)" : "var(--color-text-secondary)",
            }}
            title={collapsed ? label : undefined}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={toggle}
        className="flex items-center justify-center border-t p-2.5 transition-colors"
        style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
