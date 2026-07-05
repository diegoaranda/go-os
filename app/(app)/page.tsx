"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, FolderKanban, Inbox, ListTodo, Play } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TaskRow } from "@/components/task-row"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listInboxItems, listProjects, listTasks } from "@/lib/supabase/data"
import type { InboxItem, Project, Task } from "@/lib/types"

type MetricCardProps = {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}

function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        const [nextProjects, nextTasks, nextInboxItems] = await Promise.all([
          listProjects(),
          listTasks(),
          listInboxItems(),
        ])
        if (cancelled) return
        setProjects(nextProjects)
        setTasks(nextTasks)
        setInboxItems(nextInboxItems)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar el dashboard.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const projectName = useCallback(
    (id: string) => projects.find((project) => project.id === id)?.name ?? "Sin proyecto",
    [projects],
  )

  const metrics = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== "Terminado")

    return {
      activeProjects: projects.filter((project) => project.status === "Activo").length,
      activeTasks: activeTasks.length,
      inProgressTasks: tasks.filter((task) => task.status === "En curso").length,
      doneTasks: tasks.filter((task) => task.status === "Terminado").length,
      pendingInbox: inboxItems.filter((item) => !item.archived).length,
    }
  }, [inboxItems, projects, tasks])

  const inProgressTasks = tasks
    .filter((task) => task.status === "En curso")
    .slice(0, 5)
  const latestInboxItems = inboxItems.filter((item) => !item.archived).slice(0, 5)
  const recentProjects = [...projects].reverse().slice(0, 5)
  const hasAnyData = projects.length > 0 || tasks.length > 0 || inboxItems.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Go OS"
        description="Tu centro de operaciones personal con datos reales de Supabase."
      />

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando dashboard...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && !hasAnyData ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Todavía no hay datos para mostrar. Crea proyectos, tareas o items de inbox.
        </p>
      ) : null}

      {!isLoading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Proyectos activos"
              value={metrics.activeProjects}
              icon={FolderKanban}
            />
            <MetricCard label="Tareas activas" value={metrics.activeTasks} icon={ListTodo} />
            <MetricCard label="En curso" value={metrics.inProgressTasks} icon={Play} />
            <MetricCard label="Terminadas" value={metrics.doneTasks} icon={CheckCircle2} />
            <MetricCard label="Inbox pendiente" value={metrics.pendingInbox} icon={Inbox} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Tareas en curso</CardTitle>
                  <Link
                    href="/tasks"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Ver Tasks
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {inProgressTasks.length > 0 ? (
                  inProgressTasks.map((task) => (
                    <TaskRow key={task.id} task={task} projectName={projectName} />
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No hay tareas en curso.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Últimos Inbox</CardTitle>
                  <Link
                    href="/inbox"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Abrir
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestInboxItems.length > 0 ? (
                  latestInboxItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                      <p className="line-clamp-2 text-sm font-medium">{item.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.createdAt}</span>
                        <Badge variant="outline" className="border-transparent bg-secondary font-normal">
                          {projectName(item.suggestedProject)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Inbox sin pendientes.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Proyectos recientes</CardTitle>
                  <Link
                    href="/projects"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Ver Projects
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.client}</p>
                        </div>
                        <Badge variant="outline" className="border-transparent bg-secondary font-normal">
                          {project.status}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                        {project.nextAction}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                    No hay proyectos todavía.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
