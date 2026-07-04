"use client"

import { useState } from "react"
import { ArrowRight, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react"
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
import { ProjectStatusBadge, PriorityBadge } from "@/components/status-badge"
import { priorities, projectStatuses, useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { Priority, Project, ProjectStatus } from "@/lib/types"

type ProjectFormState = {
  name: string
  client: string
  status: ProjectStatus
  priority: Priority
  nextAction: string
  progress: string
}

function fromProject(project?: Project): ProjectFormState {
  return {
    name: project?.name ?? "",
    client: project?.client ?? "",
    status: project?.status ?? "Activo",
    priority: project?.priority ?? "Media",
    nextAction: project?.nextAction ?? "",
    progress: String(project?.progress ?? 0),
  }
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Project
  onSubmit: (input: Omit<Project, "id" | "links">) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState<ProjectFormState>(() => fromProject(initial))

  const submit = () => {
    const name = form.name.trim()
    const client = form.client.trim()
    if (!name || !client) return
    onSubmit({
      name,
      client,
      status: form.status,
      priority: form.priority,
      nextAction: form.nextAction.trim() || "Definir próxima acción",
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
    })
    if (!initial) setForm(fromProject())
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
          placeholder="Cliente o área"
        />
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
        <Button onClick={submit} size="sm" className="gap-1">
          {initial ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {initial ? "Guardar" : "Crear"}
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
  const { projects, addProject, updateProject, deleteProject } = useAppStore()
  const [editing, setEditing] = useState<string | null>(null)

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
          <ProjectForm onSubmit={addProject} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{project.name}</h2>
                  <p className="text-xs text-muted-foreground">{project.client}</p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Prioridad</span>
                <PriorityBadge priority={project.priority} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {editing === project.id ? (
                <ProjectForm
                  initial={project}
                  onSubmit={(input) => {
                    updateProject(project.id, input)
                    setEditing(null)
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
                      onClick={() => deleteProject(project.id)}
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
        ))}
      </div>
    </div>
  )
}
