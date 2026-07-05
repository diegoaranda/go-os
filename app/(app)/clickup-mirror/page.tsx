"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, RefreshCw, Users } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client"
import { listClickUpMirrorTasks } from "@/lib/supabase/data"
import type { ClickUpMirrorTask } from "@/lib/types"

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
  const normalized = priority.toLowerCase()

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

function statusColumnClass(index: number) {
  const accents = [
    "border-primary/25",
    "border-sky-500/25",
    "border-amber-500/25",
    "border-emerald-500/25",
    "border-muted-foreground/20",
  ]

  return accents[index % accents.length]
}

function groupTasksByStatus(tasks: ClickUpMirrorTask[]) {
  const groups = new Map<string, ClickUpMirrorTask[]>()

  for (const task of tasks) {
    const status = task.status || "Sin estado"
    groups.set(status, [...(groups.get(status) ?? []), task])
  }

  return Array.from(groups.entries()).map(([status, statusTasks]) => ({
    status,
    tasks: statusTasks,
  }))
}

function MirrorTaskCard({ task }: { task: ClickUpMirrorTask }) {
  const assignees =
    task.assignees.length > 0
      ? task.assignees.map((assignee) => assignee.name).join(", ")
      : "Sin responsables"

  return (
    <Card size="sm" className="bg-background/70">
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
        {task.taskUrl ? (
          <a
            href={task.taskUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            Abrir en ClickUp
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function ClickUpMirrorPage() {
  const [tasks, setTasks] = useState<ClickUpMirrorTask[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")
  const [syncMessage, setSyncMessage] = useState("")

  const lastSyncedAt = useMemo(() => {
    return tasks.reduce((latest, task) => {
      if (!latest) return task.syncedAt
      return new Date(task.syncedAt) > new Date(latest) ? task.syncedAt : latest
    }, "")
  }, [tasks])

  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks])

  async function upsertPulledTasks(pulledTasks: PulledClickUpTask[]) {
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
  }

  async function loadTasks() {
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
  }

  async function syncNow() {
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
      setSyncing(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadInitialTasks() {
      setError("")
      try {
        const nextTasks = await listClickUpMirrorTasks()
        if (!cancelled) setTasks(nextTasks)
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
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="ClickUp Mirror"
        description="Espejo visual de una lista de Rey del Abasto en modo solo lectura."
        action={
          <Button onClick={syncNow} disabled={syncing} className="gap-2">
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando" : "Sincronizar ahora"}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Última sincronización</p>
            <p className="text-sm text-muted-foreground">
              {lastSyncedAt ? formatDateTime(lastSyncedAt) : "Todavía no hay snapshot guardado."}
            </p>
          </div>
          <Badge variant="outline">{tasks.length} tareas en cache</Badge>
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
            {groupedTasks.map((group, index) => (
              <section
                key={group.status}
                className={`rounded-lg border ${statusColumnClass(index)} bg-card/40 p-3`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold">{group.status}</h2>
                  <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs tabular-nums text-muted-foreground">
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
            <p className="text-sm font-medium">No hay tareas sincronizadas todavía.</p>
            <p className="text-sm text-muted-foreground">
              Configura las variables de ClickUp y usa “Sincronizar ahora” para crear el
              primer snapshot.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
