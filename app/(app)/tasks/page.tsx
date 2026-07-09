"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TaskRow } from "@/components/task-row"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createTask,
  deleteTask,
  listAreas,
  listProjects,
  listTasks,
  updateTask,
} from "@/lib/supabase/data"
import {
  operativeTaskStatuses,
  type Area,
  type Project,
  type Task,
  type TaskStatus,
} from "@/lib/types"

const ALL = "all"
const NONE = "none"

type TaskFormState = {
  title: string
  areaId: string
  projectId: string
  status: TaskStatus
}

function fromTask(task?: Task): TaskFormState {
  return {
    title: task?.title ?? "",
    areaId: task?.areaId ?? "",
    projectId: task?.projectId ?? "",
    status: task?.status ?? "Pendiente",
  }
}

function TaskForm({
  initial,
  areas,
  projects,
  onSubmit,
  onCancel,
}: {
  initial?: Task
  areas: Area[]
  projects: Project[]
  onSubmit: (input: Omit<Task, "id">) => void | Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState<TaskFormState>(() => fromTask(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const filteredProjects = form.areaId
    ? projects.filter((project) => project.areaId === form.areaId)
    : projects
  const preservedTaskFields = {
    priority: initial?.priority ?? "Media",
    due: initial?.due ?? "Hoy",
    source: initial?.source ?? "Manual",
  } satisfies Pick<Task, "priority" | "due" | "source">

  const submit = async () => {
    const title = form.title.trim()
    if (!title) return
    setIsSubmitting(true)

    try {
      await onSubmit({
        title,
        areaId: form.areaId || null,
        projectId: form.projectId || null,
        status: form.status,
        ...preservedTaskFields,
      })
      if (!initial) setForm(fromTask())
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
        <Label htmlFor={initial ? `title-${initial.id}` : "new-task-title"}>Tarea</Label>
        <Input
          id={initial ? `title-${initial.id}` : "new-task-title"}
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Nueva tarea"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Área</Label>
        <Select
          value={form.areaId || NONE}
          onValueChange={(value) =>
            setForm((current) => {
              const areaId = value === NONE ? "" : value ?? current.areaId
              const currentProject = projects.find((project) => project.id === current.projectId)

              return {
                ...current,
                areaId,
                projectId:
                  areaId && currentProject?.areaId !== areaId ? "" : current.projectId,
              }
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sin área</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Proyecto</Label>
        <Select
          value={form.projectId || NONE}
          onValueChange={(value) =>
            setForm((current) => {
              if (value === NONE) return { ...current, projectId: "" }

              const project = projects.find((item) => item.id === value)
              return {
                ...current,
                projectId: value ?? current.projectId,
                areaId: project?.areaId || current.areaId,
              }
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sin proyecto</SelectItem>
            {filteredProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Estado</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, status: value as TaskStatus }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operativeTaskStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button
          onClick={submit}
          size="sm"
          className="gap-1"
          disabled={isSubmitting}
        >
          {initial ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {isSubmitting ? "Guardando..." : initial ? "Guardar" : "Crear"}
        </Button>
        {onCancel ? (
          <Button onClick={onCancel} variant="ghost" size="sm" className="gap-1">
            <X className="size-4" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [status, setStatus] = useState(ALL)
  const [editing, setEditing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [nextAreas, nextProjects, nextTasks] = await Promise.all([
          listAreas(),
          listProjects(),
          listTasks(),
        ])
        if (cancelled) return
        setAreas(nextAreas)
        setProjects(nextProjects)
        setTasks(nextTasks)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudieron cargar las tareas.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const areaName = useCallback(
    (id?: string | null) => areas.find((item) => item.id === id)?.name ?? "Sin área",
    [areas],
  )

  const projectName = useCallback(
    (id?: string | null) => projects.find((item) => item.id === id)?.name ?? "Sin proyecto",
    [projects],
  )

  const filtered = useMemo(
    () => tasks.filter((task) => status === ALL || task.status === status),
    [tasks, status],
  )

  const createSupabaseTask = async (input: Omit<Task, "id">) => {
    setError("")
    try {
      const task = await createTask(input)
      setTasks((current) => [task, ...current])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la tarea.")
      throw caught
    }
  }

  const updateSupabaseTask = async (id: string, input: Omit<Task, "id">) => {
    setError("")
    try {
      const task = await updateTask(id, input)
      setTasks((current) =>
        current.map((currentTask) => (currentTask.id === id ? task : currentTask)),
      )
      setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la tarea.")
      throw caught
    }
  }

  const deleteSupabaseTask = async (id: string) => {
    const shouldDelete = window.confirm("¿Eliminar esta tarea?")
    if (!shouldDelete) return

    setError("")
    try {
      await deleteTask(id)
      setTasks((current) => current.filter((task) => task.id !== id))
      if (editing === id) setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar la tarea.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Gestiona tareas reales de Supabase con edición básica y filtros por estado."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear tarea</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm areas={areas} projects={projects} onSubmit={createSupabaseTask} />
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando tareas...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={(value) => setStatus(value ?? ALL)}>
            <SelectTrigger className="w-[150px]" size="sm">
              <SelectValue>{status === ALL ? "Todas" : status}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {operativeTaskStatuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {status !== ALL ? (
            <Button variant="ghost" size="sm" onClick={() => setStatus(ALL)}>
              Limpiar
            </Button>
          ) : null}

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "tarea" : "tareas"}
          </span>
        </div>
      ) : null}

      <div className="space-y-2">
        {!isLoading && filtered.length > 0 ? (
          filtered.map((task) =>
            editing === task.id ? (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <TaskForm
                    initial={task}
                    areas={areas}
                    projects={projects}
                    onSubmit={(input) => {
                      return updateSupabaseTask(task.id, input)
                    }}
                    onCancel={() => setEditing(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <div key={task.id} className="flex flex-col gap-2">
                <TaskRow task={task} areaName={areaName} projectName={projectName} />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(task.id)}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <Pencil className="size-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void deleteSupabaseTask(task.id)
                    }}
                    className="h-7 gap-1 px-2 text-xs text-destructive"
                  >
                    <Trash2 className="size-3" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ),
          )
        ) : null}

        {!isLoading && !error && filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {tasks.length === 0
              ? "No hay tareas todavía. Crea una tarea para empezar."
              : "No hay tareas que coincidan con los filtros."}
          </p>
        ) : null}
      </div>
    </div>
  )
}
