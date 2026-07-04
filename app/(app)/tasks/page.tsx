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
import { priorities, taskStatuses } from "@/lib/store"
import {
  createTask,
  deleteTask,
  listProjects,
  listTasks,
  updateTask,
} from "@/lib/supabase/data"
import type { Priority, Project, Task, TaskSource, TaskStatus } from "@/lib/types"

const sources: TaskSource[] = ["Manual", "ClickUp", "Inbox"]
const dueOptions = ["Hoy", "Mañana", "Esta semana", "Sin fecha"]
const ALL = "all"

type TaskFormState = {
  title: string
  projectId: string
  status: TaskStatus
  priority: Priority
  due: string
  source: TaskSource
}

function fromTask(task?: Task, projectId = ""): TaskFormState {
  return {
    title: task?.title ?? "",
    projectId: task?.projectId ?? projectId,
    status: task?.status ?? "Pendiente",
    priority: task?.priority ?? "Media",
    due: task?.due ?? "Hoy",
    source: task?.source ?? "Manual",
  }
}

function TaskForm({
  initial,
  projects,
  onSubmit,
  onCancel,
}: {
  initial?: Task
  projects: Project[]
  onSubmit: (input: Omit<Task, "id">) => void | Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState<TaskFormState>(() => fromTask(initial, projects[0]?.id ?? ""))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedProjectId = form.projectId || projects[0]?.id || ""

  const submit = async () => {
    const title = form.title.trim()
    if (!title || !selectedProjectId) return
    setIsSubmitting(true)

    try {
      await onSubmit({
        title,
        projectId: selectedProjectId,
        status: form.status,
        priority: form.priority,
        due: form.due,
        source: form.source,
      })
      if (!initial) setForm(fromTask(undefined, projects[0]?.id ?? ""))
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
        <Label htmlFor={initial ? `title-${initial.id}` : "new-task-title"}>Tarea</Label>
        <Input
          id={initial ? `title-${initial.id}` : "new-task-title"}
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Nueva tarea"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Proyecto</Label>
        <Select
          value={selectedProjectId}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, projectId: value ?? current.projectId }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
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
            {taskStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Prioridad</Label>
        <Select
          value={form.priority}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, priority: value as Priority }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Fecha</Label>
        <Select
          value={form.due}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, due: value ?? current.due }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dueOptions.map((due) => (
              <SelectItem key={due} value={due}>
                {due}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Origen</Label>
        <Select
          value={form.source}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, source: value as TaskSource }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
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
          disabled={isSubmitting || projects.length === 0}
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
  const [projects, setProjects] = useState<Project[]>([])
  const [project, setProject] = useState(ALL)
  const [priority, setPriority] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [source, setSource] = useState(ALL)
  const [editing, setEditing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [nextProjects, nextTasks] = await Promise.all([
          listProjects(),
          listTasks(),
        ])
        if (cancelled) return
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

  const projectName = useCallback(
    (id: string) => projects.find((item) => item.id === id)?.name ?? id,
    [projects],
  )

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (project === ALL || task.projectId === project) &&
          (priority === ALL || task.priority === priority) &&
          (status === ALL || task.status === status) &&
          (source === ALL || task.source === source),
      ),
    [tasks, project, priority, status, source],
  )

  const reset = () => {
    setProject(ALL)
    setPriority(ALL)
    setStatus(ALL)
    setSource(ALL)
  }

  const hasFilters = [project, priority, status, source].some((filter) => filter !== ALL)

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
        description="Todas tus tareas, con filtros por proyecto, prioridad, estado y origen."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear tarea</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm projects={projects} onSubmit={createSupabaseTask} />
          {projects.length === 0 && !isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Crea un proyecto antes de agregar tareas.
            </p>
          ) : null}
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

      <div className="flex flex-wrap items-center gap-2">
        <Select value={project} onValueChange={(value) => setProject(value ?? ALL)}>
          <SelectTrigger className="w-[170px]" size="sm">
            <SelectValue>
              {(value) =>
                value === ALL
                  ? "Todos los proyectos"
                  : projects.find((item) => item.id === value)?.name
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los proyectos</SelectItem>
            {projects.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(value) => setPriority(value ?? ALL)}>
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue>
              {(value) => (value === ALL ? "Toda prioridad" : (value as string))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda prioridad</SelectItem>
            {priorities.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => setStatus(value ?? ALL)}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue>
              {(value) => (value === ALL ? "Todo estado" : (value as string))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo estado</SelectItem>
            {taskStatuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={(value) => setSource(value ?? ALL)}>
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue>
              {(value) => (value === ALL ? "Todo origen" : (value as string))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo origen</SelectItem>
            {sources.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Limpiar
          </Button>
        ) : null}

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "tarea" : "tareas"}
        </span>
      </div>

      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((task) =>
            editing === task.id ? (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <TaskForm
                    initial={task}
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
                <TaskRow task={task} projectName={projectName} />
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
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No hay tareas que coincidan con los filtros.
          </p>
        )}
      </div>
    </div>
  )
}
