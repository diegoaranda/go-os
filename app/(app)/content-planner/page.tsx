"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Pencil,
  Plus,
  RotateCcw,
  Table2,
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
  createContentPost,
  deleteContentPost,
  listAreas,
  listContentPosts,
  listProjects,
  updateContentPost,
} from "@/lib/supabase/data"
import {
  contentPostStatuses,
  type Area,
  type ContentPost,
  type ContentPostStatus,
  type Project,
} from "@/lib/types"

const ALL = "all"
const NONE = "none"
const DEFAULT_CHANNELS = ["Instagram", "LinkedIn", "TikTok", "YouTube", "Newsletter"]
const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

type PlannerView = "table" | "week"

type PlannerFormState = {
  title: string
  description: string
  publishDate: string
  channel: string
  status: ContentPostStatus
  projectId: string
  areaId: string
  notes: string
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getTodayDateValue() {
  return toDateValue(new Date())
}

function getWeekStart(date: Date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day

  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  return start
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)

  nextDate.setDate(nextDate.getDate() + days)
  nextDate.setHours(0, 0, 0, 0)

  return nextDate
}

function getWeekRange(start: Date) {
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return {
    start: toDateValue(start),
    end: toDateValue(end),
  }
}

function formatDate(value: string) {
  if (!value) return "Sin fecha"

  const [year, month, day] = value.split("-").map(Number)
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day))
}

function formatWeekRange(range: { start: string; end: string }) {
  return `${formatDate(range.start)} - ${formatDate(toDateValue(addDays(parseDateValue(range.end), -1)))}`
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function fromPost(post?: ContentPost): PlannerFormState {
  return {
    title: post?.title ?? "",
    description: post?.description ?? "",
    publishDate: post?.publishDate ?? getTodayDateValue(),
    channel: post?.channel ?? DEFAULT_CHANNELS[0],
    status: post?.status ?? "Idea",
    projectId: post?.projectId ?? "",
    areaId: post?.areaId ?? "",
    notes: post?.notes ?? "",
  }
}

function statusBadgeClass(status: ContentPostStatus) {
  if (status === "Publicado") return "border-transparent bg-primary text-primary-foreground"
  if (status === "Programado") return "border-transparent bg-secondary text-foreground"
  if (status === "Cancelado") return "border-destructive/30 text-destructive"
  if (status === "Diseñado") return "border-transparent bg-muted text-foreground"
  if (status === "Pendiente") return "border-border text-muted-foreground"

  return "border-dashed text-muted-foreground"
}

function getTableEmptyMessage({
  hasPosts,
  tableCurrentWeekOnly,
}: {
  hasPosts: boolean
  tableCurrentWeekOnly: boolean
}) {
  if (!hasPosts) return "No hay publicaciones todavía. Crea la primera para empezar."
  if (tableCurrentWeekOnly) return "No hay publicaciones esta semana con los filtros actuales."

  return "No hay publicaciones que coincidan con los filtros."
}

function ContentPostListCard({
  post,
  projectName,
  areaName,
  pendingPostId,
  onMarkPublished,
  onEdit,
  onDelete,
}: {
  post: ContentPost
  projectName: (id: string) => string
  areaName: (id: string) => string
  pendingPostId: string | null
  onMarkPublished: (post: ContentPost) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_110px_120px_140px_1fr_auto] lg:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{post.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {post.description || "Sin descripción."}
            </p>
          </div>
          <span className="text-sm tabular-nums">{formatDate(post.publishDate)}</span>
          <Badge variant="outline" className="w-fit border-transparent bg-secondary font-normal">
            Canal: {post.channel || "Sin canal"}
          </Badge>
          <Badge variant="outline" className={`w-fit ${statusBadgeClass(post.status)}`}>
            {post.status}
          </Badge>
          <div className="min-w-0 text-xs text-muted-foreground">
            <p className="truncate">{projectName(post.projectId)}</p>
            <p className="truncate">{areaName(post.areaId)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {post.status !== "Publicado" ? (
              <Button
                size="sm"
                onClick={() => onMarkPublished(post)}
                disabled={pendingPostId === post.id}
                className="h-7 gap-1 px-2 text-xs"
              >
                <CheckCircle2 className="size-3" />
                Publicado
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(post.id)}
              className="h-7 gap-1 px-2 text-xs"
            >
              <Pencil className="size-3" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(post.id)}
              className="h-7 gap-1 px-2 text-xs text-destructive"
            >
              <Trash2 className="size-3" />
              Eliminar
            </Button>
          </div>
        </div>
        {post.notes ? (
          <p className="mt-3 rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            {post.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function WeeklyPostCard({
  post,
  projectName,
  pendingPostId,
  onMarkPublished,
  onEdit,
}: {
  post: ContentPost
  projectName: (id: string) => string
  pendingPostId: string | null
  onMarkPublished: (post: ContentPost) => void
  onEdit: (id: string) => void
}) {
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <p className="line-clamp-2 text-sm font-medium">{post.title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className="border-transparent bg-secondary text-[11px] font-normal"
        >
          {post.channel || "Sin canal"}
        </Badge>
        <Badge variant="outline" className={`text-[11px] ${statusBadgeClass(post.status)}`}>
          {post.status}
        </Badge>
      </div>
      {post.projectId ? (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {projectName(post.projectId)}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {post.status !== "Publicado" ? (
          <Button
            size="sm"
            onClick={() => onMarkPublished(post)}
            disabled={pendingPostId === post.id}
            className="h-7 gap-1 px-2 text-xs"
          >
            <CheckCircle2 className="size-3" />
            Publicado
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(post.id)}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Pencil className="size-3" />
          Editar
        </Button>
      </div>
    </div>
  )
}

function ContentPostForm({
  initial,
  areas,
  projects,
  onSubmit,
  onCancel,
}: {
  initial?: ContentPost
  areas: Area[]
  projects: Project[]
  onSubmit: (input: Omit<ContentPost, "id" | "createdAt" | "updatedAt">) => void | Promise<void>
  onCancel?: () => void
}) {
  const [form, setForm] = useState<PlannerFormState>(() => fromPost(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const title = form.title.trim()
    const channel = form.channel.trim()
    if (!title || !form.publishDate || !channel) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        description: form.description.trim(),
        publishDate: form.publishDate,
        channel,
        status: form.status,
        projectId: form.projectId,
        areaId: form.areaId,
        notes: form.notes.trim(),
      })
      if (!initial) setForm(fromPost())
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor={initial ? `post-title-${initial.id}` : "new-post-title"}>
          Publicación
        </Label>
        <Input
          id={initial ? `post-title-${initial.id}` : "new-post-title"}
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Título de la publicación"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={initial ? `post-date-${initial.id}` : "new-post-date"}>
          Fecha
        </Label>
        <Input
          id={initial ? `post-date-${initial.id}` : "new-post-date"}
          type="date"
          value={form.publishDate}
          onChange={(event) =>
            setForm((current) => ({ ...current, publishDate: event.target.value }))
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={initial ? `post-channel-${initial.id}` : "new-post-channel"}>
          Canal
        </Label>
        <Input
          id={initial ? `post-channel-${initial.id}` : "new-post-channel"}
          value={form.channel}
          onChange={(event) =>
            setForm((current) => ({ ...current, channel: event.target.value }))
          }
          placeholder="Instagram, LinkedIn..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Estado</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, status: value as ContentPostStatus }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentPostStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
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

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor={initial ? `post-description-${initial.id}` : "new-post-description"}>
          Descripción
        </Label>
        <Textarea
          id={initial ? `post-description-${initial.id}` : "new-post-description"}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Idea base o ángulo de la publicación"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-4">
        <Label htmlFor={initial ? `post-notes-${initial.id}` : "new-post-notes"}>
          Notas
        </Label>
        <Textarea
          id={initial ? `post-notes-${initial.id}` : "new-post-notes"}
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({ ...current, notes: event.target.value }))
          }
          placeholder="Notas internas opcionales"
          rows={2}
        />
      </div>

      <div className="flex items-end gap-2 md:col-span-2 xl:col-span-4">
        <Button
          onClick={submit}
          size="sm"
          className="gap-1"
          disabled={isSubmitting || !form.title.trim() || !form.channel.trim()}
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

export default function ContentPlannerPage() {
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [view, setView] = useState<PlannerView>("table")
  const [tableCurrentWeekOnly, setTableCurrentWeekOnly] = useState(false)
  const [visibleWeekStart, setVisibleWeekStart] = useState(() => getWeekStart(new Date()))
  const [statusFilter, setStatusFilter] = useState<typeof ALL | ContentPostStatus>(ALL)
  const [channelFilter, setChannelFilter] = useState(ALL)
  const [projectFilter, setProjectFilter] = useState(ALL)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingPostId, setPendingPostId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadPlanner() {
      try {
        const [nextPosts, nextProjects, nextAreas] = await Promise.all([
          listContentPosts(),
          listProjects(),
          listAreas(),
        ])
        if (cancelled) return
        setPosts(nextPosts)
        setProjects(nextProjects)
        setAreas(nextAreas)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo cargar Content Planner.",
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPlanner()

    return () => {
      cancelled = true
    }
  }, [])

  const currentWeekStart = useMemo(() => getWeekStart(new Date()), [])
  const currentWeekRange = useMemo(() => getWeekRange(currentWeekStart), [currentWeekStart])
  const visibleWeekRange = useMemo(() => getWeekRange(visibleWeekStart), [visibleWeekStart])
  const visibleWeekDays = useMemo(
    () =>
      dayLabels.map((label, index) => {
        const date = addDays(visibleWeekStart, index)

        return {
          label,
          date,
          value: toDateValue(date),
        }
      }),
    [visibleWeekStart],
  )
  const channelOptions = useMemo(() => {
    return Array.from(
      new Set([...DEFAULT_CHANNELS, ...posts.map((post) => post.channel).filter(Boolean)]),
    ).sort((a, b) => a.localeCompare(b))
  }, [posts])

  const projectName = (id: string) =>
    projects.find((project) => project.id === id)?.name ?? "Sin proyecto"

  const areaName = (id: string) => areas.find((area) => area.id === id)?.name ?? "Sin área"

  const baseFilteredPosts = posts.filter((post) => {
    const matchesStatus = statusFilter === ALL || post.status === statusFilter
    const matchesChannel = channelFilter === ALL || post.channel === channelFilter
    const matchesProject = projectFilter === ALL || post.projectId === projectFilter

    return matchesStatus && matchesChannel && matchesProject
  })

  const tablePosts = baseFilteredPosts.filter((post) => {
    if (!tableCurrentWeekOnly) return true
    return post.publishDate >= currentWeekRange.start && post.publishDate < currentWeekRange.end
  })

  const weekPosts = baseFilteredPosts.filter(
    (post) =>
      post.publishDate >= visibleWeekRange.start && post.publishDate < visibleWeekRange.end,
  )

  const postsByDay = weekPosts.reduce<Record<string, ContentPost[]>>((groups, post) => {
    groups[post.publishDate] = [...(groups[post.publishDate] ?? []), post]
    return groups
  }, {})

  const visiblePosts = view === "table" ? tablePosts : weekPosts

  const createSupabasePost = async (
    input: Omit<ContentPost, "id" | "createdAt" | "updatedAt">,
  ) => {
    setError("")
    try {
      const post = await createContentPost(input)
      setPosts((current) => [...current, post])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la publicación.")
      throw caught
    }
  }

  const updateSupabasePost = async (
    id: string,
    input: Partial<Omit<ContentPost, "id" | "createdAt" | "updatedAt">>,
  ) => {
    setError("")
    setPendingPostId(id)
    try {
      const post = await updateContentPost(id, input)
      setPosts((current) =>
        current.map((currentPost) => (currentPost.id === id ? post : currentPost)),
      )
      setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la publicación.")
      throw caught
    } finally {
      setPendingPostId(null)
    }
  }

  const deleteSupabasePost = async (id: string) => {
    const shouldDelete = window.confirm("¿Eliminar esta publicación?")
    if (!shouldDelete) return

    setError("")
    try {
      await deleteContentPost(id)
      setPosts((current) => current.filter((post) => post.id !== id))
      if (editing === id) setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar la publicación.")
    }
  }

  const markPostAsPublished = (post: ContentPost) => {
    void updateSupabasePost(post.id, { status: "Publicado" }).catch(() => undefined)
  }

  const goToPreviousWeek = () => {
    setVisibleWeekStart((date) => addDays(date, -7))
  }

  const goToCurrentWeek = () => {
    setVisibleWeekStart(getWeekStart(new Date()))
  }

  const goToNextWeek = () => {
    setVisibleWeekStart((date) => addDays(date, 7))
  }

  const editPostFromWeek = (id: string) => {
    setStatusFilter(ALL)
    setChannelFilter(ALL)
    setProjectFilter(ALL)
    setTableCurrentWeekOnly(false)
    setEditing(id)
    setView("table")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Planner"
        description="Planifica publicaciones semanales y manuales sin automatizaciones."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear publicación</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentPostForm
            areas={areas}
            projects={projects}
            onSubmit={createSupabasePost}
          />
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando Content Planner...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={view === "table" ? "default" : "outline"}
              onClick={() => setView("table")}
              className="gap-1"
            >
              <Table2 className="size-4" />
              Vista Tabla
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "default" : "outline"}
              onClick={() => setView("week")}
              className="gap-1"
            >
              <Columns3 className="size-4" />
              Vista Semana
            </Button>

            {view === "table" ? (
              <Button
                size="sm"
                variant={tableCurrentWeekOnly ? "default" : "outline"}
                onClick={() => setTableCurrentWeekOnly((current) => !current)}
              >
                Semana actual
              </Button>
            ) : null}

            {view === "week" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={goToPreviousWeek}>
                  <ChevronLeft className="size-4" />
                  Semana anterior
                </Button>
                <Button size="sm" variant="outline" onClick={goToCurrentWeek}>
                  <RotateCcw className="size-4" />
                  Semana actual
                </Button>
                <Button size="sm" variant="outline" onClick={goToNextWeek}>
                  Semana siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as typeof ALL | ContentPostStatus)
              }
            >
              <SelectTrigger className="w-[150px]" size="sm">
                <SelectValue>
                  {statusFilter === ALL ? "Todo estado" : statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todo estado</SelectItem>
                {contentPostStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={channelFilter}
              onValueChange={(value) => setChannelFilter(value ?? ALL)}
            >
              <SelectTrigger className="w-[160px]" size="sm">
                <SelectValue>
                  {channelFilter === ALL ? "Todo canal" : channelFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todo canal</SelectItem>
                {channelOptions.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
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
                  {projectFilter === ALL ? "Todo proyecto" : projectName(projectFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todo proyecto</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="ml-auto text-xs text-muted-foreground">
              {visiblePosts.length}{" "}
              {visiblePosts.length === 1 ? "publicación" : "publicaciones"}
            </span>
          </div>

          {view === "week" ? (
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <span className="font-medium">Semana visible</span>
              <span className="ml-2 text-muted-foreground">
                {formatWeekRange(visibleWeekRange)}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                En mobile, desplázate horizontalmente para ver todos los días.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {view === "table" ? (
        <div className="space-y-3">
          {!isLoading && !error && tablePosts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {getTableEmptyMessage({
                hasPosts: posts.length > 0,
                tableCurrentWeekOnly,
              })}
            </p>
          ) : null}

          {tablePosts.map((post) =>
            editing === post.id ? (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <ContentPostForm
                    initial={post}
                    areas={areas}
                    projects={projects}
                    onSubmit={(input) => updateSupabasePost(post.id, input)}
                    onCancel={() => setEditing(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <ContentPostListCard
                key={post.id}
                post={post}
                projectName={projectName}
                areaName={areaName}
                pendingPostId={pendingPostId}
                onMarkPublished={markPostAsPublished}
                onEdit={setEditing}
                onDelete={deleteSupabasePost}
              />
            ),
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          {!isLoading && !error && weekPosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {posts.length === 0
              ? "No hay publicaciones todavía. Crea la primera para empezar."
              : "No hay publicaciones en esta semana con los filtros actuales."}
          </p>
        ) : null}

          <div className="grid min-w-[980px] grid-cols-7 gap-3">
            {visibleWeekDays.map((day) => {
              const dayPosts = postsByDay[day.value] ?? []

              return (
                <div key={day.value} className="rounded-lg border border-border bg-card">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-sm font-medium">{day.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(day.value)}</p>
                  </div>
                  <div className="space-y-2 p-2">
                    {dayPosts.length > 0 ? (
                      dayPosts.map((post) => (
                        <WeeklyPostCard
                          key={post.id}
                          post={post}
                          projectName={projectName}
                          pendingPostId={pendingPostId}
                          onMarkPublished={markPostAsPublished}
                          onEdit={editPostFromWeek}
                        />
                      ))
                    ) : (
                      <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                        Sin publicaciones este día.
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
