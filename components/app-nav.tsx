"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Columns3,
  Layers,
  FolderKanban,
  ListChecks,
  Inbox,
  Store,
  Library,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/weekly-review", label: "Weekly Review", icon: ClipboardCheck },
  { href: "/content-planner", label: "Content Planner", icon: CalendarDays },
  { href: "/clickup-mirror", label: "ClickUp Mirror", icon: Columns3 },
  { href: "/areas", label: "Areas", icon: Layers },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/rey-del-abasto", label: "Rey del Abasto", icon: Store },
  { href: "/library", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-bold">Go</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">Go OS</p>
          <p className="text-xs text-muted-foreground">Personal Ops</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            DA
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-sidebar-foreground">Diego</p>
            <p className="text-xs text-muted-foreground">Operador</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  // Show the 5 most-used destinations on mobile bottom nav.
  const mobileItems = navItems.filter((i) =>
    ["/", "/today", "/tasks", "/inbox", "/rey-del-abasto"].includes(i.href),
  )
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-stretch justify-around">
        {mobileItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              <span className="max-w-16 truncate">
                {item.href === "/rey-del-abasto" ? "Abasto" : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
