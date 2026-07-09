"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, RefreshCw, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getClickUpStatusLabel,
  getClickUpStatusSortIndex,
  getPrimaryClickUpStatusKey,
  primaryClickUpStatuses,
  normalizeClickUpStatus,
} from "@/lib/clickup/statuses"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabase/client"
import { listClickUpMirrorTasks } from "@/lib/supabase/data"
import { openClickUpTask } from "@/lib/clickup/open-task"
import type { ClickUpMirrorTask } from "@/lib/types"

const AUTO_SYNC_STALE_MS = 30 * 60 * 1000
const ASSIGNEE_FILTERS = ["Diego", "Todos", "Jorge", "Sin responsable"] as const
const ASSIGNEE_FILTER_STORAGE_KEY = "go-os.clickup-mirror.assignee-filter"

type AssigneeFilter = (typeof ASSIGNEE_FILTERS)[number]

type PulledClickUpTask = {
  externalId: string
  listId: string
  taskName: string
  status: string
  priority: string | null
  assignees: Array<{ id: string; name: string; email?: string }>
  dueDate: string | null
  taskUrl: string | null
  rawPayload: unknown
}

type ClickUpMirrorUpsertRow = {
  user_id: string
  external_id: string
  list_id: string
  task_name: string
  status: string
  priority: string | null
  assignees_json: PulledClickUpTask["assignees"]
  due_date: string | null
  task_url: string | null
  raw_payload: unknown
  synced_at: string
}

function normalizeLabel(value: string) {
  return normalizeClickUpStatus(value)
}

function isAssigneeFilter(value: string | null): value is AssigneeFilter {
  return ASSIGNEE_FILTERS.some((filter) => filter === value)
}

function isHighPriority(priority: string) {
  const normalized = normalizeLabel(priority)

  return normalized.includes("urgent") || normalized.includes("high") || normalized.includes("alta")
}

function priorityRank(priority: string) {
  return isHighPriority(priority) ? 0 : 1
}

function dueTimestamp(value: string) {
  if (!value) return Number.POSITIVE_INFINITY

  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

function isOverdue(task: ClickUpMirrorTask) {
  if (!task.dueDate) return false

  const due = new Date(task.dueDate).getTime()
  if (!Number.isFinite(due)) return false

  return due < startOfToday().getTime()
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today
}

function endOfToday() {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return today
}

function endOfWeek() {
  const today = startOfToday()
  const day = today.getDay()
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  const end = new Date(today)
  end.setDate(today.getDate() + daysUntilSunday)
  end.setHours(23, 59, 59, 999)

  return end
}

function isDueToday(task: ClickUpMirrorTask) {
  if (!task.dueDate) return false

  const due = new Date(task.dueDate).getTime()
  if (!Number.isFinite(due)) return false

  return due >= startOfToday().getTime() && due <= endOfToday().getTime()
}

function isDueThisWeek(task: ClickUpMirrorTask) {
  if (!task.dueDate || isOverdue(task) || isDueToday(task)) return false

  const due = new Date(task.dueDate).getTime()
  if (!Number.isFinite(due)) return false

  return due <= endOfWeek().getTime()
}

function isReadyToPublishStatus(status: string) {
  const normalized = normalizeLabel(status)

  return normalized.includes("publicar") || normalized.includes("publish")
}

function taskMatchesAssignee(task: ClickUpMirrorTask, filter: AssigneeFilter) {
  if (filter === "Todos") return true
  if (filter === "Sin responsable") return task.assignees.length === 0

  return task.assignees.some((assignee) =>
    normalizeLabel(assignee.name).includes(normalizeLabel(filter)),
  )
}

function sortMirrorTasks(tasks: ClickUpMirrorTask[]) {
  return [...tasks].sort((a, b) => {
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority)
    if (byPriority !== 0) return byPriority

    const byDueDate = dueTimestamp(a.dueDate) - dueTimestamp(b.dueDate)
    if (byDueDate !== 0) return byDueDate

    return a.taskName.localeCompare(b.taskName, "es", { sensitivity: "base" })
  })
}

function shouldAutoSync(lastSyncedAt: string) {
  if (!lastSyncedAt) return true

  const timestamp = new Date(lastSyncedAt).getTime()
  if (!Number.isFinite(timestamp)) return true

  return Date.now() - timestamp > AUTO_SYNC_STALE_MS
}

function formatDateTime(value: string) {
  if (!value) return "Sin sincronizar"

  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatDueDate(value: string) {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function priorityClass(priority: string) {
  const normalized = normalizeLabel(priority)

  if (normalized.includes("urgent") || normalized.includes("alta")) {
    return "border-destructive/30 text-destructive"
  }
  if (normalized.includes("high")) return "border-destructive/30 text-destructive"
  if (normalized.includes("normal") || normalized.includes("media")) {
    return "border-transparent bg-secondary text-foreground"
  }
  if (normalized.includes("low") || normalized.includes("baja")) {
    return "border-border text-muted-foreground"
  }

  return "border-dashed text-muted-foreground"
}

function statusColumnClass(status: string) {
  const normalized = normalizeLabel(status)

  if (
    normalized.includes("bloque") ||
    normalized.includes("correg") ||
    normalized.includes("deten") ||
    normalized.includes("stuck")
  ) {
    return "border-destructive/35 bg-destructive/5"
  }
  if (
    normalized.includes("aprob") ||
    normalized.includes("listo") ||
    normalized.includes("finaliz") ||
    normalized.includes("revisado") ||
    normalized.includes("done") ||
    normalized.includes("complete")
  ) {
    return "border-emerald-500/35 bg-emerald-500/5"
  }
  if (
    normalized.includes("revis") ||
    normalized.includes("approval") ||
    normalized.includes("aprobacion")
  ) {
    return "border-amber-500/35 bg-amber-500/5"
  }
  if (normalized.includes("publicar") || normalized.includes("publish")) {
    return "border-primary/35 bg-primary/5"
  }
  if (
    normalized.includes("proceso") ||
    normalized.includes("diseñ") ||
    normalized.includes("trabaj") ||
    normalized.includes("progress") ||
    normalized.includes("doing")
  ) {
    return "border-sky-500/35 bg-sky-500/5"
  }
  if (
    normalized.includes("por hacer") ||
    normalized.includes("pendiente") ||
    normalized.includes("todo") ||
    normalized.includes("to do") ||
    normalized.includes("backlog")
  ) {
    return "border-muted-foreground/25 bg-card/40"
  }

  return "border-border bg-card/40"
}

function statusCountClass(status: string) {
  const normalized = normalizeLabel(status)

  if (
    normalized.includes("bloque") ||
    normalized.includes("correg") ||
    normalized.includes("deten") ||
    normalized.includes("stuck")
  ) {
    return "bg-destructive/10 text-destructive"
  }
  if (
    normalized.includes("aprob") ||
    normalized.includes("listo") ||
    normalized.includes("finaliz") ||
    normalized.includes("revisado") ||
    normalized.includes("done") ||
    normalized.includes("complete")
  ) {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
  }
  if (
    normalized.includes("revis") ||
    normalized.includes("approval") ||
    normalized.includes("aprobacion")
  ) {
    return "bg-amber-500/15 text-amber-600 dark:text-amber-300"
  }
  if (normalized.includes("publicar") || normalized.includes("publish")) {
    return "bg-primary/10 text-primary"
  }
  if (
    normalized.includes("proceso") ||
    normalized.includes("diseñ") ||
    normalized.includes("trabaj") ||
    normalized.includes("progress") ||
    normalized.includes("doing")
  ) {
    return "bg-sky-500/15 text-sky-600 dark:text-sky-300"
  }

  return "bg-secondary text-muted-foreground"
}

function groupTasksByStatus(tasks: ClickUpMirrorTask[]) {
  const groups = new Map<string, { status: string; tasks: ClickUpMirrorTask[] }>()

  for (const task of tasks) {
    const status = getClickUpStatusLabel(task.status || "Sin estado")
    const key = getPrimaryClickUpStatusKey(task.status)
      ? status
      : normalizeClickUpStatus(task.status || "Sin estado")
    const current = groups.get(key)

    groups.set(key, {
      status,
      tasks: [...(current?.tasks ?? []), task],
    })
  }

  const orderedPrimaryGroups = primaryClickUpStatuses.flatMap((primaryStatus) => {
    const group = groups.get(primaryStatus.label)
    return group ? [{ status: group.status, tasks: sortMirrorTasks(group.tasks) }] : []
  })

  const otherGroups = Array.from(groups.values())
    .filter((group) => getClickUpStatusSortIndex(group.status) >= primaryClickUpStatuses.length)
    .sort((a, b) => a.status.localeCompare(b.status, "es"))
    .map((group) => ({
      status: group.status,
      tasks: sortMirrorTasks(group.tasks),
    }))

  return [...orderedPrimaryGroups, ...otherGroups]
}

function MirrorTaskCard({ task }: { task: ClickUpMirrorTask }) {
  const assignees =
    task.assignees.length > 0
      ? task.assignees.map((assignee) => assignee.name).join(", ")
      : "Sin responsables"

  const card = (
    <Card
      size="sm"
      className={`bg-background/70 ${
        task.taskUrl ? "transition-colors hover:border-primary/35 hover:bg-background" : ""
      }`}
    >
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-snug">{task.taskName}</p>
          <p className="text-xs text-muted-foreground">ID ClickUp: {task.externalId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={priorityClass(task.priority)}>
            {task.priority || "Sin prioridad"}
          </Badge>
          <Badge variant="secondary">{formatDueDate(task.dueDate)}</Badge>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span className="line-clamp-2">{assignees}</span>
        </p>
        <div className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors group-hover:bg-muted group-hover:text-foreground">
          {task.taskUrl ? (
            <>
              Abrir en ClickUp
              <ExternalLink className="size-3.5" />
            </>
          ) : (
            "Sin enlace de ClickUp"
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!task.taskUrl) return card

  return (
    <a
      href={task.taskUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.preventDefault()
        openClickUpTask(task.taskUrl)
      }}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </a>
  )
}

function OperationalSummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/50 px-3 py-2">
      <p className="text-[11px] leading-none text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export default function ClickUpMirrorPage() {
  const [tasks, setTasks] = useState<ClickUpMirrorTask[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")
  const [syncMessage, setSyncMessage] = useState("")
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("Diego")
  const [assigneeFilterRestored, setAssigneeFilterRestored] = useState(false)
  const syncInFlightRef = useRef(false)

  const lastSyncedAt = useMemo(() => {
    return tasks.reduce((latest, task) => {
      if (!latest) return task.syncedAt
      return new Date(task.syncedAt) > new Date(latest) ? task.syncedAt : latest
    }, "")
  }, [tasks])

  const filteredTasks = useMemo(
    () => tasks.filter((task) => taskMatchesAssignee(task, assigneeFilter)),
    [assigneeFilter, tasks],
  )

  const groupedTasks = useMemo(() => groupTasksByStatus(filteredTasks), [filteredTasks])

  const summary = useMemo(
    () => ({
      total: filteredTasks.length,
      highPriority: filteredTasks.filter((task) => isHighPriority(task.priority)).length,
      withoutAssignee: filteredTasks.filter((task) => task.assignees.length === 0).length,
      readyToPublish: filteredTasks.filter((task) => isReadyToPublishStatus(task.status)).length,
    }),
    [filteredTasks],
  )

  const operationalSummary = useMemo(
    () => ({
      overdue: filteredTasks.filter(isOverdue).length,
      dueToday: filteredTasks.filter(isDueToday).length,
      dueThisWeek: filteredTasks.filter(isDueThisWeek).length,
      withoutDueDate: filteredTasks.filter((task) => !task.dueDate).length,
    }),
    [filteredTasks],
  )

  const upsertPulledTasks = useCallback(async (pulledTasks: PulledClickUpTask[]) => {
    const supabase = getSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error("No authenticated Supabase user.")

    const syncedAt = new Date().toISOString()
    const rows: ClickUpMirrorUpsertRow[] = pulledTasks.map((task) => ({
      user_id: user.id,
      external_id: task.externalId,
      list_id: task.listId,
      task_name: task.taskName,
      status: task.status,
      priority: task.priority,
      assignees_json: task.assignees,
      due_date: task.dueDate,
      task_url: task.taskUrl,
      raw_payload: task.rawPayload,
      synced_at: syncedAt,
    }))

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("clickup_mirror_tasks")
        .upsert(rows, { onConflict: "user_id,list_id,external_id" })

      if (upsertError) {
        console.error("[ClickUp Mirror] Snapshot upsert failed", upsertError)
        throw upsertError
      }

      const listId = rows[0].list_id
      const currentExternalIds = new Set(rows.map((row) => row.external_id))
      const { data: existingRows, error: existingError } = await supabase
        .from("clickup_mirror_tasks")
        .select("external_id")
        .eq("user_id", user.id)
        .eq("list_id", listId)

      if (existingError) {
        console.error("[ClickUp Mirror] Snapshot refetch for stale cleanup failed", existingError)
        throw existingError
      }

      const staleIds = ((existingRows ?? []) as Array<{ external_id: string }>).flatMap(
        (row) => (currentExternalIds.has(row.external_id) ? [] : [row.external_id]),
      )

      if (staleIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("clickup_mirror_tasks")
          .delete()
          .eq("user_id", user.id)
          .eq("list_id", listId)
          .in("external_id", staleIds)

        if (deleteError) {
          console.error("[ClickUp Mirror] Snapshot stale cleanup failed", deleteError)
          throw deleteError
        }
      }
    }

    return rows.length
  }, [])

  const loadTasks = useCallback(async () => {
    setError("")
    try {
      const nextTasks = await listClickUpMirrorTasks()
      setTasks(nextTasks)
    } catch (loadError) {
      console.error("[ClickUp Mirror] Refetch/list load failed", {
        error: loadError,
        message: loadError instanceof Error ? loadError.message : String(loadError),
        stack: loadError instanceof Error ? loadError.stack : undefined,
      })
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el espejo de ClickUp.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (syncInFlightRef.current) return

    syncInFlightRef.current = true
    setSyncing(true)
    setSyncMessage("")
    setError("")

    try {
      const response = await fetch("/api/clickup-mirror/pull")
      const payload = (await response.json()) as {
        tasks?: PulledClickUpTask[]
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo sincronizar ClickUp.")
      }

      const pulledTasks = Array.isArray(payload.tasks) ? payload.tasks : []
      const count = await upsertPulledTasks(pulledTasks)

      setSyncMessage(`Sincronización completa: ${count} tareas.`)
      await loadTasks()
    } catch (syncError) {
      console.error("[ClickUp Mirror] Sync failed in client flow", {
        error: syncError,
        message: syncError instanceof Error ? syncError.message : String(syncError),
        stack: syncError instanceof Error ? syncError.stack : undefined,
      })
      setError(
        syncError instanceof Error
          ? syncError.message
          : "No se pudo sincronizar ClickUp.",
      )
    } finally {
      syncInFlightRef.current = false
      setSyncing(false)
    }
  }, [loadTasks, upsertPulledTasks])

  useEffect(() => {
    try {
      const storedFilter = window.localStorage.getItem(ASSIGNEE_FILTER_STORAGE_KEY)
      if (isAssigneeFilter(storedFilter)) {
        setAssigneeFilter(storedFilter)
      }
    } finally {
      setAssigneeFilterRestored(true)
    }
  }, [])

  useEffect(() => {
    if (!assigneeFilterRestored) return

    try {
      window.localStorage.setItem(ASSIGNEE_FILTER_STORAGE_KEY, assigneeFilter)
    } catch {
      // If localStorage is unavailable, keep the in-page filter state only.
    }
  }, [assigneeFilter, assigneeFilterRestored])

  useEffect(() => {
    let cancelled = false

    async function loadInitialTasks() {
      setError("")
      try {
        const nextTasks = await listClickUpMirrorTasks()
        if (cancelled) return

        setTasks(nextTasks)
        if (shouldAutoSync(nextTasks[0]?.syncedAt ?? "")) {
          void syncNow()
        }
      } catch (loadError) {
        console.error("[ClickUp Mirror] Initial list load failed", {
          error: loadError,
          message: loadError instanceof Error ? loadError.message : String(loadError),
          stack: loadError instanceof Error ? loadError.stack : undefined,
        })
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el espejo de ClickUp.",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInitialTasks()

    return () => {
      cancelled = true
    }
  }, [syncNow])

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
            ClickUp Mirror
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Solo lectura de Rey del Abasto</span>
            <span className="hidden text-border sm:inline">|</span>
            <span>
              Sync: {lastSyncedAt ? formatDateTime(lastSyncedAt) : "sin snapshot"}
            </span>
            <Badge variant="outline" className="h-5 px-2 text-[11px]">
              {tasks.length} en cache
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={syncNow} disabled={syncing} className="gap-2">
            <RefreshCw className={`size-4 ${syncing ? "animate-spin motion-reduce:animate-none" : ""}`} />
            {syncing ? "Sincronizando" : "Sincronizar ahora"}
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:w-72">
            <p className="text-sm font-medium">Responsable</p>
            <Select
              value={assigneeFilter}
              onValueChange={(value) => {
                if (isAssigneeFilter(value)) setAssigneeFilter(value)
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNEE_FILTERS.map((filter) => (
                  <SelectItem key={filter} value={filter}>
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <CompactMetric label="Total visible" value={summary.total} />
            <CompactMetric label="Urgentes / high" value={summary.highPriority} />
            <CompactMetric label="Sin responsable" value={summary.withoutAssignee} />
            <CompactMetric label="Por publicar" value={summary.readyToPublish} />
          </div>
        </CardContent>
      </Card>

      {syncMessage ? (
        <p className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {syncMessage}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {["Cargando estados", "Cargando tareas", "Preparando tablero"].map((label) => (
            <Card key={label}>
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-32 rounded bg-secondary" />
                <div className="h-24 rounded border border-dashed border-border bg-secondary/30" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedTasks.length > 0 ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[860px] gap-4 md:grid-cols-3 xl:grid-cols-4">
            {groupedTasks.map((group) => (
              <section
                key={group.status}
                className={`rounded-lg border ${statusColumnClass(group.status)} p-3`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold">{group.status}</h2>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${statusCountClass(
                      group.status,
                    )}`}
                  >
                    {group.tasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.tasks.map((task) => (
                    <MirrorTaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm font-medium">
              {tasks.length > 0
                ? "No hay tareas para este responsable."
                : "No hay tareas sincronizadas todavía."}
            </p>
            <p className="text-sm text-muted-foreground">
              {tasks.length > 0
                ? "Cambia el filtro para ver el resto del tablero."
                : "Configura las variables de ClickUp y usa “Sincronizar ahora” para crear el primer snapshot."}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <p className="text-sm font-medium">Resumen operativo</p>
            <p className="text-xs text-muted-foreground">
              Calculado sobre la vista filtrada actual.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OperationalSummaryMetric label="Vencidas" value={operationalSummary.overdue} />
            <OperationalSummaryMetric label="Vencen hoy" value={operationalSummary.dueToday} />
            <OperationalSummaryMetric
              label="Vencen esta semana"
              value={operationalSummary.dueThisWeek}
            />
            <OperationalSummaryMetric label="Sin fecha" value={operationalSummary.withoutDueDate} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
