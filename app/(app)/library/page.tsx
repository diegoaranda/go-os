"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  LinkIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
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
  email: "Correo",
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function formatLibraryDate(value: string) {
  if (!value) return "Sin fecha"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
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
  const [searchQuery, setSearchQuery] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
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

  const areaNameById = useMemo(
    () => new Map(areas.map((area) => [area.id, area.name])),
    [areas],
  )

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  )

  const areaName = (id: string) =>
    id ? areaNameById.get(id) ?? "Sin área" : "Sin área"

  const projectName = (id: string) =>
    id ? projectNameById.get(id) ?? "Sin proyecto" : "Sin proyecto"

  const filteredItems = useMemo(() => {
    const query = normalizeSearch(searchQuery)

    return items.filter((item) => {
      const matchesFilters =
        (typeFilter === ALL || item.type === typeFilter) &&
        (areaFilter === ALL || item.areaId === areaFilter) &&
        (projectFilter === ALL || item.projectId === projectFilter)

      if (!matchesFilters) return false
      if (!query) return true

      const searchable = [
        item.title,
        item.url,
        item.content,
        typeLabels[item.type],
        item.type,
        item.areaId ? areaNameById.get(item.areaId) ?? "Sin área" : "Sin área",
        item.projectId
          ? projectNameById.get(item.projectId) ?? "Sin proyecto"
          : "Sin proyecto",
      ]
        .map(normalizeSearch)
        .join(" ")

      return searchable.includes(query)
    })
  }, [
    areaFilter,
    areaNameById,
    items,
    projectFilter,
    projectNameById,
    searchQuery,
    typeFilter,
  ])

  const hasFilters =
    typeFilter !== ALL ||
    areaFilter !== ALL ||
    projectFilter !== ALL ||
    searchQuery.trim().length > 0

  const resetFilters = () => {
    setSearchQuery("")
    setTypeFilter(ALL)
    setAreaFilter(ALL)
    setProjectFilter(ALL)
  }

  const copyText = async (key: string, value: string) => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1500)
    } catch {
      setError("No se pudo copiar al portapapeles.")
    }
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
    <div className="flex flex-col gap-6">
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
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por título, link, nota, tipo, área o proyecto"
              className="h-8 pl-8"
            />
          </div>

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

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {filteredItems.map((item) => (
          <div key={item.id} className="border-b border-border last:border-b-0">
            <div className="p-3">
              {editing === item.id ? (
                <LibraryItemForm
                  initial={item}
                  areas={areas}
                  projects={projects}
                  onSubmit={(input) => updateSupabaseLibraryItem(item.id, input)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] grid-rows-[auto_2rem_minmax(3.5rem,auto)_1.75rem] gap-x-3 gap-y-2">
                  <div className="col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="min-w-0 truncate text-sm font-semibold">{item.title}</h2>
                    <Badge variant="outline" className="font-normal">
                      {typeLabels[item.type]}
                    </Badge>
                    {item.areaId ? (
                      <Badge
                        variant="outline"
                        className="bg-background font-normal text-muted-foreground"
                      >
                        {areaName(item.areaId)}
                      </Badge>
                    ) : null}
                    {item.projectId ? (
                      <Badge
                        variant="outline"
                        className="bg-background font-normal text-muted-foreground"
                      >
                        {projectName(item.projectId)}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="col-start-1 row-start-2 flex min-w-0 items-center gap-1.5 text-xs">
                    <LinkIcon className="shrink-0 text-muted-foreground" />
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 truncate font-medium text-primary hover:underline"
                      >
                        {item.url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Sin link</span>
                    )}
                    {item.url ? <ExternalLink className="shrink-0 text-muted-foreground" /> : null}
                  </div>

                  <div className="col-start-2 row-start-2 flex justify-end">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      onClick={() => void copyText(`${item.id}-url`, item.url)}
                      disabled={!item.url}
                      title="Copiar link"
                      aria-label="Copiar link"
                    >
                      {copiedKey === `${item.id}-url` ? <Check /> : <Copy />}
                    </Button>
                  </div>

                  <div className="col-start-1 row-start-3 min-w-0 rounded-md bg-secondary/30 px-2.5 py-2">
                    <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <FileText />
                      Nota
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                      {item.content || "Sin nota"}
                    </p>
                  </div>

                  <div className="col-start-2 row-start-3 flex justify-end">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => void copyText(`${item.id}-content`, item.content)}
                      disabled={!item.content}
                      title="Copiar nota"
                      aria-label="Copiar nota"
                    >
                      {copiedKey === `${item.id}-content` ? <Check /> : <Copy />}
                    </Button>
                  </div>

                  <span className="col-start-1 row-start-4 self-center whitespace-nowrap text-xs text-muted-foreground">
                    {formatLibraryDate(item.createdAt)}
                  </span>

                  <div className="col-start-2 row-start-4 grid grid-cols-2 gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => setEditing(item.id)}
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        void deleteSupabaseLibraryItem(item.id)
                      }}
                      className="text-destructive"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
