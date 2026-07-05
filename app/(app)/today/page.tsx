"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, Circle, Pencil, Play, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TaskRow } from "@/components/task-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  listActiveTodayTasks,
  listProjects,
  updateTask,
} from "@/lib/supabase/data"
import type { Project, Task } from "@/lib/types"

const todayFilters = ["Todas", "En curso", "Pendientes"] as const
type TodayFilter = (typeof todayFilters)[number]

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<TodayFilter>("Todas")
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editProjectId, setEditProjectId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadToday() {
      try {
        const [nextProjects, nextTasks] = await Promise.all([
          listProjects(),
          listActiveTodayTasks(),
        ])
        if (cancelled) return
        setProjects(nextProjects)
        setTasks(nextTasks)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar Today.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadToday()

    return () => {
      cancelled = true
    }
  }, [])

  const projectName = useCallback(
    (id: string) => projects.find((project) => project.id === id)?.name ?? "Sin proyecto",
    [projects],
  )

  const refreshTasks = async () => {
    const nextTasks = await listActiveTodayTasks()
    setTasks(nextTasks)
  }

  const startEditing = (task: Task) => {
    setEditing(task.id)
    setEditTitle(task.title)
    setEditProjectId(task.projectId)
  }

  const markTask = async (task: Task, status: Task["status"]) => {
    setError("")
    setPendingTaskId(task.id)

    try {
      await updateTask(task.id, { status })
      await refreshTasks()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar la tarea.")
    } finally {
      setPendingTaskId(null)
    }
  }

  const saveTask = async (task: Task) => {
    const title = editTitle.trim()
    if (!title) return
    setError("")
    setPendingTaskId(task.id)

    try {
      await updateTask(task.id, {
        title,
        projectId: editProjectId || task.projectId,
      })
      await refreshTasks()
      setEditing(null)
      setEditTitle("")
      setEditProjectId("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo editar la tarea.")
    } finally {
      setPendingTaskId(null)
    }
  }

  const visibleTasks = tasks.filter((task) => {
    if (filter === "En curso") return task.status === "En curso"
    if (filter === "Pendientes") return task.status === "Pendiente"
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description="Enfócate en lo esencial. Tareas activas reales desde Supabase."
      />

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando tareas de hoy...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay tareas activas para Today. Las tareas terminadas quedan fuera de esta vista.
        </p>
      ) : null}

      <section className="space-y-3">
        {!isLoading && tasks.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">Tareas activas</h2>
              <span className="text-xs text-muted-foreground">{visibleTasks.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayFilters.map((nextFilter) => (
                <Button
                  key={nextFilter}
                  size="sm"
                  variant={filter === nextFilter ? "default" : "outline"}
                  onClick={() => setFilter(nextFilter)}
                  className="h-8 px-3 text-xs"
                >
                  {nextFilter}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {!isLoading && !error && tasks.length > 0 && visibleTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No hay tareas para este filtro.
            </p>
          ) : null}

          {visibleTasks.map((task) => (
            <div key={task.id} className="space-y-2">
              {editing === task.id ? (
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                    <Input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                          event.preventDefault()
                          void saveTask(task)
                        }
                      }}
                      aria-label="Editar título de tarea"
                    />
                    <Select
                      value={editProjectId}
                      onValueChange={(value) => setEditProjectId(value ?? "")}
                    >
                      <SelectTrigger
                        className="w-full lg:w-[220px]"
                        aria-label="Proyecto asociado"
                      >
                        <SelectValue placeholder="Proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          void saveTask(task)
                        }}
                        disabled={pendingTaskId === task.id}
                        className="h-8 gap-1"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(null)
                          setEditTitle("")
                          setEditProjectId("")
                        }}
                        className="h-8 gap-1 text-muted-foreground"
                      >
                        <X className="size-3.5" />
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <TaskRow task={task} projectName={projectName} />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void markTask(task, "Pendiente")
                      }}
                      disabled={pendingTaskId === task.id || task.status === "Pendiente"}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Circle className="size-3" />
                      Pendiente
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void markTask(task, "En curso")
                      }}
                      disabled={pendingTaskId === task.id || task.status === "En curso"}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Play className="size-3" />
                      En curso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(task)}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Pencil className="size-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        void markTask(task, "Terminado")
                      }}
                      disabled={pendingTaskId === task.id}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <CheckCircle2 className="size-3" />
                      Terminado
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
