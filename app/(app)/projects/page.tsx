"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react"
import { ContextualLibrarySection } from "@/components/contextual-library-section"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { buttonVariants, Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ProjectStatusBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/status-badge"
import {
  createLibraryItem,
  createProject,
  deleteProject,
  deleteLibraryItem,
  listAreas,
  listLibraryItems,
  listProjects,
  listTasks,
  updateProject,
} from "@/lib/supabase/data"
import { cn } from "@/lib/utils"
import {
  priorities,
  projectStatuses,
  type Area,
  type KnowledgeLibraryItem,
  type Priority,
  type Project,
  type ProjectStatus,
  type Task,
} from "@/lib/types"

const NO_AREA = "none"

type ProjectFormState = {
  name: string
  areaId: string
  client: string
  status: ProjectStatus
  priority: Priority
  nextAction: string
  progress: string
}

function fromProject(project?: Project): ProjectFormState {
  return {
    name: project?.name ?? "",
    areaId: project?.areaId ?? "",
    client: project?.client ?? "",
    status: project?.status ?? "Activo",
    priority: project?.priority ?? "Media",
    nextAction: project?.nextAction ?? "",
    progress: String(project?.progress ?? 0),
  }
}

function ProjectForm({
  initial,
  areas,
  onSubmit,
  onCancel,
}: {
  initial?: Project
  areas: Area[]
  onSubmit: (input: Omit<Project, "id" | "links">) => void | Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState<ProjectFormState>(() => fromProject(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const name = form.name.trim()
    const client = form.client.trim()
    if (!name || !client) return
    setIsSubmitting(true)

    try {
      await onSubmit({
        name,
        areaId: form.areaId,
        client,
        status: form.status,
        priority: form.priority,
        nextAction: form.nextAction.trim() || "Definir próxima acción",
        progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
      })
      if (!initial) setForm(fromProject())
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={initial ? `name-${initial.id}` : "new-project-name"}>Proyecto</Label>
        <Input
          id={initial ? `name-${initial.id}` : "new-project-name"}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Nombre del proyecto"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={initial ? `client-${initial.id}` : "new-project-client"}>Cliente</Label>
        <Input
          id={initial ? `client-${initial.id}` : "new-project-client"}
          value={form.client}
          onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))}
          placeholder="Cliente o frente"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Área</Label>
        <Select
          value={form.areaId || NO_AREA}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              areaId: value === NO_AREA ? "" : value ?? current.areaId,
            }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_AREA}>Sin área</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
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
            setForm((current) => ({ ...current, status: value as ProjectStatus }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectStatuses.map((status) => (
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
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={initial ? `action-${initial.id}` : "new-project-action"}>
          Próxima acción
        </Label>
        <Input
          id={initial ? `action-${initial.id}` : "new-project-action"}
          value={form.nextAction}
          onChange={(event) =>
            setForm((current) => ({ ...current, nextAction: event.target.value }))
          }
          placeholder="Qué toca hacer después"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={initial ? `progress-${initial.id}` : "new-project-progress"}>
          Progreso
        </Label>
        <Input
          id={initial ? `progress-${initial.id}` : "new-project-progress"}
          value={form.progress}
          onChange={(event) =>
            setForm((current) => ({ ...current, progress: event.target.value }))
          }
          inputMode="numeric"
          placeholder="0"
        />
      </div>
      <div className="flex items-end gap-2">
        <Button onClick={submit} size="sm" className="gap-1" disabled={isSubmitting}>
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

export default function ProjectsPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [libraryItems, setLibraryItems] = useState<KnowledgeLibraryItem[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [nextAreas, nextProjects, nextTasks, nextLibraryItems] = await Promise.all([
          listAreas(),
          listProjects(),
          listTasks(),
          listLibraryItems(),
        ])
        if (cancelled) return
        setAreas(nextAreas)
        setProjects(nextProjects)
        setTasks(nextTasks)
        setLibraryItems(nextLibraryItems)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudieron cargar los proyectos.")
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

  const tasksByProject = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((groups, task) => {
      groups[task.projectId] = [...(groups[task.projectId] ?? []), task]
      return groups
    }, {})
  }, [tasks])

  const libraryItemsByProject = useMemo(() => {
    return libraryItems.reduce<Record<string, KnowledgeLibraryItem[]>>((groups, item) => {
      if (!item.projectId) return groups
      groups[item.projectId] = [...(groups[item.projectId] ?? []), item]
      return groups
    }, {})
  }, [libraryItems])

  const areaName = (id?: string) => {
    if (!id) return "Sin área"
    return areas.find((area) => area.id === id)?.name ?? "Sin área"
  }

  const createSupabaseProject = async (input: Omit<Project, "id" | "links">) => {
    setError("")
    try {
      const project = await createProject({ ...input, links: [] })
      setProjects((current) => [...current, project])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el proyecto.")
      throw caught
    }
  }

  const updateSupabaseProject = async (
    id: string,
    input: Omit<Project, "id" | "links">,
  ) => {
    setError("")
    try {
      const project = await updateProject(id, input)
      setProjects((current) =>
        current.map((currentProject) =>
          currentProject.id === id ? project : currentProject,
        ),
      )
      setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el proyecto.")
      throw caught
    }
  }

  const createProjectLibraryItem = async (
    input: Omit<KnowledgeLibraryItem, "id" | "createdAt">,
  ) => {
    setError("")
    try {
      const item = await createLibraryItem(input)
      setLibraryItems((current) => [item, ...current])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el recurso.")
      throw caught
    }
  }

  const deleteProjectLibraryItem = async (id: string) => {
    const shouldDelete = window.confirm("¿Eliminar este recurso?")
    if (!shouldDelete) return

    setError("")
    try {
      await deleteLibraryItem(id)
      setLibraryItems((current) => current.filter((item) => item.id !== id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el recurso.")
    }
  }

  const deleteSupabaseProject = async (id: string) => {
    const shouldDelete = window.confirm(
      "¿Eliminar este proyecto? También se eliminarán sus tareas asociadas.",
    )
    if (!shouldDelete) return

    setError("")
    try {
      await deleteProject(id)
      setProjects((current) => current.filter((project) => project.id !== id))
      setTasks((current) => current.filter((task) => task.projectId !== id))
      setLibraryItems((current) =>
        current.map((item) => (item.projectId === id ? { ...item, projectId: "" } : item)),
      )
      if (editing === id) setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el proyecto.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Todos tus proyectos personales y de cliente en un solo lugar."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm areas={areas} onSubmit={createSupabaseProject} />
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando proyectos...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay proyectos todavía.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const projectTasks = tasksByProject[project.id] ?? []

          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{project.name}</h2>
                    <p className="text-xs text-muted-foreground">{project.client}</p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Área</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {areaName(project.areaId)}
                  </span>
                  <span className="text-xs text-muted-foreground">Prioridad</span>
                  <PriorityBadge priority={project.priority} />
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {projectTasks.length} {projectTasks.length === 1 ? "tarea" : "tareas"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {editing === project.id ? (
                  <ProjectForm
                    initial={project}
                    areas={areas}
                    onSubmit={(input) => {
                      return updateSupabaseProject(project.id, input)
                    }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progreso</span>
                        <span className="text-xs tabular-nums">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/40 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Próxima acción
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-sm">
                        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        {project.nextAction}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Tareas asociadas
                        </p>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {projectTasks.length}
                        </span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {projectTasks.length > 0 ? (
                          projectTasks.slice(0, 4).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <p className="truncate text-sm">{task.title}</p>
                              <StatusBadge status={task.status} />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Sin tareas asociadas.
                          </p>
                        )}
                      </div>
                    </div>
                    <ContextualLibrarySection
                      items={libraryItemsByProject[project.id] ?? []}
                      defaultProjectId={project.id}
                      onCreate={createProjectLibraryItem}
                      onDelete={deleteProjectLibraryItem}
                    />
                    <Separator className="mt-auto" />
                    <div className="flex flex-wrap items-center gap-2">
                      {project.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-7 gap-1 px-2 text-xs",
                          )}
                        >
                          {link.label}
                          <ExternalLink className="size-3" />
                        </a>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(project.id)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Pencil className="size-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void deleteSupabaseProject(project.id)
                        }}
                        className="h-7 gap-1 px-2 text-xs text-destructive"
                      >
                        <Trash2 className="size-3" />
                        Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
