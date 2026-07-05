"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, FileText, LinkIcon, Pencil, Plus, Trash2, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createLibraryItem,
  deleteLibraryItem,
  listAreas,
  listLibraryItems,
  listProjects,
  updateLibraryItem,
} from "@/lib/supabase/data"
import {
  libraryItemTypes,
  type Area,
  type KnowledgeLibraryItem,
  type LibraryItemType,
  type Project,
} from "@/lib/types"

const ALL = "all"
const NONE = "none"

const typeLabels: Record<LibraryItemType, string> = {
  note: "Nota",
  link: "Link",
  resource: "Recurso",
}

type LibraryFormState = {
  title: string
  type: LibraryItemType
  content: string
  url: string
  areaId: string
  projectId: string
}

function fromLibraryItem(item?: KnowledgeLibraryItem): LibraryFormState {
  return {
    title: item?.title ?? "",
    type: item?.type ?? "note",
    content: item?.content ?? "",
    url: item?.url ?? "",
    areaId: item?.areaId ?? "",
    projectId: item?.projectId ?? "",
  }
}

function LibraryItemForm({
  initial,
  areas,
  projects,
  onSubmit,
  onCancel,
}: {
  initial?: KnowledgeLibraryItem
  areas: Area[]
  projects: Project[]
  onSubmit: (input: Omit<KnowledgeLibraryItem, "id" | "createdAt">) => void | Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState<LibraryFormState>(() => fromLibraryItem(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const title = form.title.trim()
    if (!title) return
    setIsSubmitting(true)

    try {
      await onSubmit({
        title,
        type: form.type,
        content: form.content.trim(),
        url: form.url.trim(),
        areaId: form.areaId,
        projectId: form.projectId,
      })
      if (!initial) setForm(fromLibraryItem())
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={initial ? `library-title-${initial.id}` : "new-library-title"}>
          Título
        </Label>
        <Input
          id={initial ? `library-title-${initial.id}` : "new-library-title"}
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Nombre de la referencia"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <Select
          value={form.type}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, type: value as LibraryItemType }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {libraryItemTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {typeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Área</Label>
        <Select
          value={form.areaId || NONE}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              areaId: value === NONE ? "" : value ?? current.areaId,
            }))
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
            setForm((current) => ({
              ...current,
              projectId: value === NONE ? "" : value ?? current.projectId,
            }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sin proyecto</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor={initial ? `library-url-${initial.id}` : "new-library-url"}>URL</Label>
        <Input
          id={initial ? `library-url-${initial.id}` : "new-library-url"}
          value={form.url}
          onChange={(event) =>
            setForm((current) => ({ ...current, url: event.target.value }))
          }
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor={initial ? `library-content-${initial.id}` : "new-library-content"}>
          Contenido
        </Label>
        <Textarea
          id={initial ? `library-content-${initial.id}` : "new-library-content"}
          value={form.content}
          onChange={(event) =>
            setForm((current) => ({ ...current, content: event.target.value }))
          }
          placeholder="Notas, contexto o referencia rápida"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2 md:col-span-2">
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

export default function LibraryPage() {
  const [items, setItems] = useState<KnowledgeLibraryItem[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [typeFilter, setTypeFilter] = useState<typeof ALL | LibraryItemType>(ALL)
  const [areaFilter, setAreaFilter] = useState(ALL)
  const [projectFilter, setProjectFilter] = useState(ALL)
  const [editing, setEditing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [nextAreas, nextProjects, nextItems] = await Promise.all([
          listAreas(),
          listProjects(),
          listLibraryItems(),
        ])
        if (cancelled) return
        setAreas(nextAreas)
        setProjects(nextProjects)
        setItems(nextItems)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar Library.")
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

  const areaName = (id: string) =>
    id ? areas.find((area) => area.id === id)?.name ?? "Sin área" : "Sin área"

  const projectName = (id: string) =>
    id ? projects.find((project) => project.id === id)?.name ?? "Sin proyecto" : "Sin proyecto"

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (typeFilter === ALL || item.type === typeFilter) &&
          (areaFilter === ALL || item.areaId === areaFilter) &&
          (projectFilter === ALL || item.projectId === projectFilter),
      ),
    [areaFilter, items, projectFilter, typeFilter],
  )

  const hasFilters =
    typeFilter !== ALL || areaFilter !== ALL || projectFilter !== ALL

  const resetFilters = () => {
    setTypeFilter(ALL)
    setAreaFilter(ALL)
    setProjectFilter(ALL)
  }

  const createSupabaseLibraryItem = async (
    input: Omit<KnowledgeLibraryItem, "id" | "createdAt">,
  ) => {
    setError("")
    try {
      const item = await createLibraryItem(input)
      setItems((current) => [item, ...current])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el item.")
      throw caught
    }
  }

  const updateSupabaseLibraryItem = async (
    id: string,
    input: Omit<KnowledgeLibraryItem, "id" | "createdAt">,
  ) => {
    setError("")
    try {
      const item = await updateLibraryItem(id, input)
      setItems((current) =>
        current.map((currentItem) => (currentItem.id === id ? item : currentItem)),
      )
      setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el item.")
      throw caught
    }
  }

  const deleteSupabaseLibraryItem = async (id: string) => {
    const shouldDelete = window.confirm("¿Eliminar este item de Library?")
    if (!shouldDelete) return

    setError("")
    try {
      await deleteLibraryItem(id)
      setItems((current) => current.filter((item) => item.id !== id))
      if (editing === id) setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el item.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Repositorio simple de conocimiento, links y recursos."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear item</CardTitle>
        </CardHeader>
        <CardContent>
          <LibraryItemForm
            areas={areas}
            projects={projects}
            onSubmit={createSupabaseLibraryItem}
          />
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando Library...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as typeof ALL | LibraryItemType)}
          >
            <SelectTrigger className="w-[140px]" size="sm">
              <SelectValue>
                {typeFilter === ALL ? "Todo tipo" : typeLabels[typeFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todo tipo</SelectItem>
              {libraryItemTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {typeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={areaFilter} onValueChange={(value) => setAreaFilter(value ?? ALL)}>
            <SelectTrigger className="w-[170px]" size="sm">
              <SelectValue>
                {areaFilter === ALL
                  ? "Todas las áreas"
                  : areas.find((area) => area.id === areaFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las áreas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={projectFilter}
            onValueChange={(value) => setProjectFilter(value ?? ALL)}
          >
            <SelectTrigger className="w-[180px]" size="sm">
              <SelectValue>
                {projectFilter === ALL
                  ? "Todos los proyectos"
                  : projects.find((project) => project.id === projectFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar
            </Button>
          ) : null}

          <span className="ml-auto text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
          </span>
        </div>
      ) : null}

      {!isLoading && filteredItems.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay items en Library para este filtro.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-4 p-4">
              {editing === item.id ? (
                <LibraryItemForm
                  initial={item}
                  areas={areas}
                  projects={projects}
                  onSubmit={(input) => updateSupabaseLibraryItem(item.id, input)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h2 className="truncate text-sm font-semibold">{item.title}</h2>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-transparent bg-secondary font-normal">
                          {typeLabels[item.type]}
                        </Badge>
                        <Badge variant="outline" className="border-border bg-background font-normal text-muted-foreground">
                          {areaName(item.areaId)}
                        </Badge>
                        <Badge variant="outline" className="border-border bg-background font-normal text-muted-foreground">
                          {projectName(item.projectId)}
                        </Badge>
                      </div>
                    </div>
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                  </div>

                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline"
                    >
                      <LinkIcon className="size-3 shrink-0" />
                      <span className="truncate">{item.url}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : null}

                  {item.content ? (
                    <p className="line-clamp-4 rounded-md bg-secondary/40 px-2.5 py-2 text-xs text-muted-foreground">
                      {item.content}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{item.createdAt}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(item.id)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Pencil className="size-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void deleteSupabaseLibraryItem(item.id)
                        }}
                        className="h-7 gap-1 px-2 text-xs text-destructive"
                      >
                        <Trash2 className="size-3" />
                        Eliminar
                      </Button>
                    </div>
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
