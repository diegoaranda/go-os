"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Inbox,
  ListTodo,
  RotateCcw,
  Save,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  getWeeklyReviewByWeek,
  listCompletedTasksBetween,
  listInboxItemsCreatedBefore,
  listProjectsCreatedBefore,
  listRecentWeeklyReviews,
  listTasksCreatedBefore,
  upsertWeeklyReview,
} from "@/lib/supabase/data"
import type { InboxItem, Project, Task, WeeklyReview } from "@/lib/types"

type MetricCardProps = {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}

function getCurrentWeekStart() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day

  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)

  return date
}

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)

  nextDate.setDate(nextDate.getDate() + days)
  nextDate.setHours(0, 0, 0, 0)

  return nextDate
}

function formatDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseDateValue(value)
    : new Date(value)

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function getReviewExcerpt(note: string) {
  const normalized = note.trim()

  if (!normalized) return "Sin nota"
  if (normalized.length <= 90) return normalized

  return `${normalized.slice(0, 90)}...`
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

export default function WeeklyReviewPage() {
  const currentWeekStartDate = useMemo(() => getCurrentWeekStart(), [])
  const currentWeekStart = useMemo(
    () => toDateValue(currentWeekStartDate),
    [currentWeekStartDate],
  )
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(() =>
    getCurrentWeekStart(),
  )
  const weekStart = useMemo(
    () => toDateValue(selectedWeekStartDate),
    [selectedWeekStartDate],
  )
  const nextWeekStartDate = useMemo(
    () => addDays(selectedWeekStartDate, 7),
    [selectedWeekStartDate],
  )

  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [recentReviews, setRecentReviews] = useState<WeeklyReview[]>([])
  const [note, setNote] = useState("")
  const [savedAt, setSavedAt] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasLoadedReview, setHasLoadedReview] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadReview() {
      setIsLoading(true)
      setHasLoadedReview(false)
      setError("")
      setSuccess("")
      try {
        const [
          nextCompletedTasks,
          nextTasks,
          nextProjects,
          nextInboxItems,
          review,
          nextRecentReviews,
        ] = await Promise.all([
          listCompletedTasksBetween(
            selectedWeekStartDate.toISOString(),
            nextWeekStartDate.toISOString(),
          ),
          listTasksCreatedBefore(nextWeekStartDate.toISOString()),
          listProjectsCreatedBefore(nextWeekStartDate.toISOString()),
          listInboxItemsCreatedBefore(nextWeekStartDate.toISOString()),
          getWeeklyReviewByWeek(weekStart),
          listRecentWeeklyReviews(),
        ])

        if (cancelled) return

        setCompletedTasks(nextCompletedTasks)
        setTasks(nextTasks)
        setProjects(nextProjects)
        setInboxItems(nextInboxItems)
        setRecentReviews(nextRecentReviews)
        setNote(review?.note ?? "")
        setSavedAt(review?.updatedAt ?? "")
        setHasLoadedReview(true)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo cargar la weekly review.",
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadReview()

    return () => {
      cancelled = true
    }
  }, [nextWeekStartDate, selectedWeekStartDate, weekStart])

  const pendingTasks = tasks.filter((task) => task.status !== "Terminado")
  const activeProjects = projects.filter((project) => project.status === "Activo")
  const pendingInboxItems = inboxItems.filter((item) => !item.archived)

  const projectName = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.name ?? "Sin proyecto"

  async function handleSave() {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const review = await upsertWeeklyReview({
        weekStart,
        note: note.trim(),
      })
      const nextRecentReviews = await listRecentWeeklyReviews()
      setSavedAt(review.updatedAt)
      setRecentReviews(nextRecentReviews)
      setSuccess("Review guardada.")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo guardar la weekly review.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handlePreviousWeek() {
    setSelectedWeekStartDate((date) => addDays(date, -7))
  }

  function handleNextWeek() {
    setSelectedWeekStartDate((date) => addDays(date, 7))
  }

  function handleCurrentWeek() {
    setSelectedWeekStartDate(parseDateValue(currentWeekStart))
  }

  function handleSelectReview(review: WeeklyReview) {
    setSelectedWeekStartDate(parseDateValue(review.weekStart))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Review"
        description={`Semana del ${formatDate(weekStart)}.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="size-4" />
              Semana anterior
            </Button>
            {weekStart !== currentWeekStart ? (
              <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
                <RotateCcw className="size-4" />
                Semana actual
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Semana siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      {!isLoading && hasLoadedReview ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="border-transparent bg-secondary font-normal">
            {weekStart === currentWeekStart ? "Semana actual" : "Semana histórica"}
          </Badge>
          <span>
            {savedAt
              ? `Review guardada: ${formatDateTime(savedAt)}`
              : "Sin review guardada todavía"}
          </span>
        </div>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando weekly review...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && hasLoadedReview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Completadas esta semana"
              value={completedTasks.length}
              icon={CheckCircle2}
            />
            <MetricCard label="Tareas pendientes" value={pendingTasks.length} icon={ListTodo} />
            <MetricCard
              label="Proyectos activos"
              value={activeProjects.length}
              icon={FolderKanban}
            />
            <MetricCard label="Inbox pendiente" value={pendingInboxItems.length} icon={Inbox} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tareas completadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedTasks.length > 0 ? (
                  completedTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {projectName(task.projectId)}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-transparent bg-secondary">
                        {task.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No hay tareas completadas esta semana.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pendientes abiertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTasks.length > 0 ? (
                  pendingTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {projectName(task.projectId)}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-transparent bg-secondary">
                        {task.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No hay tareas pendientes.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reflexión semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value)
                  setSuccess("")
                }}
                placeholder="Qué funcionó, qué hay que ajustar y qué conviene cuidar la próxima semana."
                className="min-h-36"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {savedAt
                    ? `Último guardado: ${formatDateTime(savedAt)}`
                    : "Sin review guardada todavía."}
                </p>
                <div className="flex items-center gap-3">
                  {success ? <p className="text-xs text-primary">{success}</p> : null}
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="size-4" />
                    {isSaving ? "Guardando..." : "Guardar review"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reviews recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentReviews.length > 0 ? (
                recentReviews.map((review) => (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => handleSelectReview(review)}
                    className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Semana del {formatDate(review.weekStart)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {getReviewExcerpt(review.note)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(review.updatedAt)}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No hay reviews guardadas todavía.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
