"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  ExternalLink,
  Flame,
  FileText,
  ImageIcon,
  LinkIcon,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { StatusBadge, PriorityBadge, ContentStatusBadge } from "@/components/status-badge"
import {
  quickLinks,
  libraryItems,
} from "@/lib/data"
import { useAppStore } from "@/lib/store"

export function PriorityTasksCard() {
  const { tasks, projectName } = useAppStore()
  const priority = tasks
    .filter((t) => t.due === "Hoy" && t.status !== "Terminado")
    .slice(0, 3)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4 text-primary" />
            Prioridades de hoy
          </CardTitle>
          <Link
            href="/today"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Ver todo
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {priority.map((t) => (
          <div key={t.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">{projectName(t.projectId)}</p>
            </div>
            <PriorityBadge priority={t.priority} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ActiveProjectsCard() {
  const { projects } = useAppStore()
  const active = projects.filter((p) => p.status === "Activo").slice(0, 4)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Proyectos activos</CardTitle>
          <Link
            href="/projects"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Ver todo
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {active.map((p) => (
          <div key={p.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <span className="text-xs tabular-nums text-muted-foreground">
                {p.progress}%
              </span>
            </div>
            <Progress value={p.progress} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ContentSummaryCard() {
  const { rdaContentItems } = useAppStore()
  const counts = {
    Programado: rdaContentItems.filter((c) => c.status === "Programado").length,
    Listo: rdaContentItems.filter((c) => c.status === "Listo").length,
    "En revisión": rdaContentItems.filter((c) => c.status === "En revisión").length,
    "En pausa": rdaContentItems.filter((c) => c.status === "En pausa").length,
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Rey del Abasto</CardTitle>
            <CardDescription>Contenido de esta semana</CardDescription>
          </div>
          <Link
            href="/rey-del-abasto"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Abrir
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(counts).map(([label, count]) => (
            <div key={label} className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-2xl font-semibold tabular-nums">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-2.5">
          {rdaContentItems.slice(0, 2).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <p className="truncate text-sm">{c.product}</p>
              <ContentStatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickLinksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accesos rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {link.label}
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function WeeklyProgressCard() {
  const { tasks } = useAppStore()
  const done = tasks.filter((t) => t.status === "Terminado").length
  const total = tasks.length
  const inProgress = tasks.filter((t) => t.status === "En curso").length
  const blocked = tasks.filter((t) => t.status === "Bloqueado").length
  const pct = Math.round((done / total) * 100)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpRight className="size-4 text-primary" />
          Progreso semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tabular-nums">{pct}%</span>
            <span className="text-xs text-muted-foreground">
              {done}/{total} tareas
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-semibold tabular-nums text-primary">{inProgress}</p>
            <p className="text-xs text-muted-foreground">En curso</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-amber-400">
              {tasks.filter((t) => t.status === "En revisión").length}
            </p>
            <p className="text-xs text-muted-foreground">En revisión</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-destructive">{blocked}</p>
            <p className="text-xs text-muted-foreground">Bloqueado</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LatestLibraryCard() {
  const latest = libraryItems.slice(0, 4)
  const icons = {
    copy: FileText,
    asset: ImageIcon,
    link: LinkIcon,
    note: FileText,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimos en Library</CardTitle>
          <Link
            href="/library"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Abrir
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {latest.map((item) => {
          const Icon = icons[item.kind]
          return (
            <div key={item.id} className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/60 text-muted-foreground">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs capitalize text-muted-foreground">{item.kind}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Re-export for convenience
export { StatusBadge }
