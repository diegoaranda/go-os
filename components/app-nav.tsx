"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Columns3,
  Images,
  Layers,
  FolderKanban,
  ListChecks,
  Inbox,
  Store,
  Library,
  Menu,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/weekly-review", label: "Weekly Review", icon: ClipboardCheck },
  { href: "/content-planner", label: "Content Planner", icon: CalendarDays },
  { href: "/content-assets", label: "Content Assets", icon: Images },
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("go-os-sidebar-collapsed")
      if (saved) {
        setIsCollapsed(saved === "true")
        return
      }

      setIsCollapsed(window.matchMedia("(max-width: 1023px)").matches)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggleCollapsed = () => {
    setIsCollapsed((current) => {
      const next = !current
      window.localStorage.setItem("go-os-sidebar-collapsed", String(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        "hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-border md:bg-sidebar",
        isCollapsed ? "md:w-[4.5rem]" : "md:w-60",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 px-4",
          isCollapsed && "justify-center px-2",
        )}
      >
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-bold">Go</span>
        </div>
        <div className={cn("min-w-0 leading-tight", isCollapsed && "hidden")}>
          <p className="text-sm font-semibold text-sidebar-foreground">Go OS</p>
          <p className="text-xs text-muted-foreground">Personal Ops</p>
        </div>
      </div>
      <div className={cn("px-3 pb-2", isCollapsed && "px-2")}>
        <Button
          type="button"
          variant="ghost"
          size={isCollapsed ? "icon-sm" : "sm"}
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className={cn(
            "text-muted-foreground hover:text-sidebar-foreground",
            !isCollapsed && "w-full justify-start",
          )}
        >
          <Menu data-icon={isCollapsed ? undefined : "inline-start"} />
          {isCollapsed ? null : "Menú"}
        </Button>
      </div>
      <nav className={cn("flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2", isCollapsed && "items-center px-2")}>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "motion-nav-item flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                isCollapsed && "size-10 justify-center px-0 py-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("shrink-0", active && "text-primary")} />
              <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className={cn("shrink-0 border-t border-border p-3", isCollapsed && "p-2")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2",
            isCollapsed && "justify-center px-0",
          )}
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            DA
          </div>
          <div className={cn("min-w-0 leading-tight", isCollapsed && "hidden")}>
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-stretch gap-1 overflow-x-auto px-2 py-1.5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "motion-standard flex min-w-[4.75rem] flex-none flex-col items-center gap-1 rounded-md px-2 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon />
              <span className="max-w-16 truncate text-center">
                {item.href === "/rey-del-abasto" ? "Abasto" : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
