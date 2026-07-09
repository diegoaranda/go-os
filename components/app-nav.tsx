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
  Library,
  GripVertical,
  Menu,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const SIDEBAR_ORDER_STORAGE_KEY = "goos.sidebar.order"
export const SIDEBAR_ORDER_RESET_EVENT = "goos:sidebar-order-reset"

export const navItems = [
  { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "today", href: "/today", label: "Today", icon: CalendarCheck },
  { id: "weekly-review", href: "/weekly-review", label: "Weekly Review", icon: ClipboardCheck },
  { id: "content-planner", href: "/content-planner", label: "Content Planner", icon: CalendarDays },
  { id: "content-assets", href: "/content-assets", label: "Content Assets", icon: Images },
  { id: "clickup-mirror", href: "/clickup-mirror", label: "ClickUp Mirror", icon: Columns3 },
  { id: "areas", href: "/areas", label: "Areas", icon: Layers },
  { id: "projects", href: "/projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", href: "/tasks", label: "Tasks", icon: ListChecks },
  { id: "inbox", href: "/inbox", label: "Inbox", icon: Inbox },
  { id: "library", href: "/library", label: "Library", icon: Library },
  { id: "settings", href: "/settings", label: "Settings", icon: Settings },
]

type NavItem = (typeof navItems)[number]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

function orderedNavItems(order: string[]) {
  const byId = new Map(navItems.map((item) => [item.id, item]))
  const ordered = order
    .map((id) => byId.get(id))
    .filter((item): item is NavItem => Boolean(item))
  const orderedIds = new Set(ordered.map((item) => item.id))
  const missing = navItems.filter((item) => !orderedIds.has(item.id))

  return [...ordered, ...missing]
}

function readSidebarOrder() {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_ORDER_STORAGE_KEY)
    if (!raw) return navItems

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return navItems

    return orderedNavItems(parsed.filter((id): id is string => typeof id === "string"))
  } catch {
    return navItems
  }
}

function moveNavItem(items: NavItem[], activeId: string, overId: string) {
  const activeIndex = items.findIndex((item) => item.id === activeId)
  const overIndex = items.findIndex((item) => item.id === overId)
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return items

  const next = [...items]
  const [moved] = next.splice(activeIndex, 1)
  next.splice(overIndex, 0, moved)
  return next
}

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [orderedItems, setOrderedItems] = useState<NavItem[]>(navItems)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

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

  useEffect(() => {
    const loadOrder = () => setOrderedItems(readSidebarOrder())

    loadOrder()
    window.addEventListener("storage", loadOrder)
    window.addEventListener(SIDEBAR_ORDER_RESET_EVENT, loadOrder)

    return () => {
      window.removeEventListener("storage", loadOrder)
      window.removeEventListener(SIDEBAR_ORDER_RESET_EVENT, loadOrder)
    }
  }, [])

  const toggleCollapsed = () => {
    setIsCollapsed((current) => {
      const next = !current
      window.localStorage.setItem("go-os-sidebar-collapsed", String(next))
      return next
    })
  }

  const saveOrder = (items: NavItem[]) => {
    window.localStorage.setItem(
      SIDEBAR_ORDER_STORAGE_KEY,
      JSON.stringify(items.map((item) => item.id)),
    )
  }

  const handleDrop = (overId: string) => {
    if (!draggingId) return

    setOrderedItems((current) => {
      const next = moveNavItem(current, draggingId, overId)
      saveOrder(next)
      return next
    })
    setDraggingId(null)
    setDragOverId(null)
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
        {orderedItems.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <div
              key={item.id}
              className={cn(
                "group flex items-center rounded-md",
                dragOverId === item.id && draggingId !== item.id && "bg-sidebar-accent/35",
                draggingId === item.id && "opacity-60",
              )}
              onDragOver={(event) => {
                if (isCollapsed || !draggingId || draggingId === item.id) return
                event.preventDefault()
                setDragOverId(item.id)
              }}
              onDragLeave={() => {
                if (dragOverId === item.id) setDragOverId(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(item.id)
              }}
            >
              {isCollapsed ? null : (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    setDraggingId(item.id)
                    event.dataTransfer.effectAllowed = "move"
                    event.dataTransfer.setData("text/plain", item.id)
                  }}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setDragOverId(null)
                  }}
                  aria-label={`Reordenar ${item.label}`}
                  title={`Arrastrar ${item.label}`}
                  className="flex h-9 w-5 cursor-grab items-center justify-center rounded text-muted-foreground/50 opacity-0 outline-none transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
                >
                  <GripVertical className="size-3.5" />
                </button>
              )}
              <Link
                href={item.href}
                title={item.label}
                aria-label={item.label}
                draggable={false}
                className={cn(
                  "motion-nav-item flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  isCollapsed && "size-10 flex-none justify-center px-0 py-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className={cn("shrink-0", active && "text-primary")} />
                <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
              </Link>
            </div>
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
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
