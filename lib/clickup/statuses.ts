import type { ClickUpMirrorTask } from "@/lib/types"

export const primaryClickUpStatuses = [
  { key: "todo", label: "por hacer" },
  { key: "review", label: "pendiente a revision" },
  { key: "approved", label: "revisado/aprobado" },
  { key: "publish", label: "publicar" },
] as const

export type PrimaryClickUpStatusKey = (typeof primaryClickUpStatuses)[number]["key"]

export function normalizeClickUpStatus(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

export function getPrimaryClickUpStatusKey(status: string): PrimaryClickUpStatusKey | null {
  const normalized = normalizeClickUpStatus(status)

  if (
    normalized === "por hacer" ||
    normalized === "todo" ||
    normalized === "to do" ||
    normalized === "backlog"
  ) {
    return "todo"
  }
  if (
    normalized === "pendiente a revision" ||
    normalized === "pendiente revision" ||
    normalized === "en revision" ||
    normalized === "revisar"
  ) {
    return "review"
  }
  if (
    normalized === "revisado/aprobado" ||
    normalized === "revisado" ||
    normalized === "aprobado" ||
    normalized === "listo"
  ) {
    return "approved"
  }
  if (
    normalized === "publicar" ||
    normalized === "por publicar" ||
    normalized === "publish" ||
    normalized === "ready to publish"
  ) {
    return "publish"
  }

  return null
}

export function getClickUpStatusLabel(status: string) {
  const primaryKey = getPrimaryClickUpStatusKey(status)
  const primaryStatus = primaryClickUpStatuses.find((item) => item.key === primaryKey)

  return primaryStatus?.label ?? status
}

export function getClickUpStatusSortIndex(status: string) {
  const primaryKey = getPrimaryClickUpStatusKey(status)
  const primaryIndex = primaryClickUpStatuses.findIndex((item) => item.key === primaryKey)

  return primaryIndex >= 0 ? primaryIndex : primaryClickUpStatuses.length
}

export function countPrimaryClickUpStatuses(tasks: ClickUpMirrorTask[]) {
  const counts = new Map<PrimaryClickUpStatusKey, number>()

  for (const task of tasks) {
    const primaryKey = getPrimaryClickUpStatusKey(task.status)
    if (!primaryKey) continue

    counts.set(primaryKey, (counts.get(primaryKey) ?? 0) + 1)
  }

  return primaryClickUpStatuses.map((status) => ({
    key: status.key,
    label: status.label,
    count: counts.get(status.key) ?? 0,
    sourceStatus: status.label,
  }))
}
