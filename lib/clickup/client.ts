import { getClickUpMirrorConfig } from "@/lib/clickup/config"

export type ClickUpApiTask = {
  id: string
  name?: string
  status?: { status?: string }
  priority?: { priority?: string } | null
  assignees?: Array<{
    id?: string | number
    username?: string
    name?: string
    email?: string
  }>
  due_date?: string | null
  url?: string
}

export type NormalizedClickUpTask = {
  externalId: string
  listId: string
  taskName: string
  status: string
  priority: string | null
  assignees: Array<{ id: string; name: string; email?: string }>
  dueDate: string | null
  taskUrl: string | null
  rawPayload: ClickUpApiTask
}

type ClickUpTasksResponse = {
  tasks?: ClickUpApiTask[]
  last_page?: boolean
}

export class ClickUpApiError extends Error {
  endpoint: string
  status: number
  body: string

  constructor({
    endpoint,
    status,
    body,
  }: {
    endpoint: string
    status: number
    body: string
  }) {
    super(`ClickUp request failed with status ${status}`)
    this.name = "ClickUpApiError"
    this.endpoint = endpoint
    this.status = status
    this.body = body
  }
}

function normalizeDueDate(value: string | null | undefined) {
  if (!value) return null

  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) return null

  return new Date(timestamp).toISOString()
}

function normalizeAssignees(task: ClickUpApiTask) {
  return (task.assignees ?? []).flatMap((assignee) => {
    if (assignee.id === undefined) return []

    const name = assignee.name ?? assignee.username
    if (!name) return []

    return [
      {
        id: String(assignee.id),
        name,
        email: assignee.email,
      },
    ]
  })
}

export async function fetchClickUpMirrorTasks() {
  const { apiToken, listId } = getClickUpMirrorConfig()
  const tasks: ClickUpApiTask[] = []

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      include_closed: "true",
      subtasks: "false",
      page: String(page),
    })
    const endpoint = `/list/${listId}/task?${params.toString()}`
    const response = await fetch(`https://api.clickup.com/api/v2${endpoint}`, {
      headers: {
        Authorization: apiToken,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const body = await response.text()
      console.error("[ClickUp Mirror] ClickUp request failed", {
        step: "fetchClickUpMirrorTasks",
        endpoint,
        status: response.status,
        body,
      })
      throw new ClickUpApiError({
        endpoint,
        status: response.status,
        body,
      })
    }

    const payload = (await response.json()) as ClickUpTasksResponse
    const pageTasks = payload.tasks ?? []

    tasks.push(...pageTasks)

    if (payload.last_page === true || pageTasks.length === 0) break
  }

  return tasks.map<NormalizedClickUpTask>((task) => ({
    externalId: task.id,
    listId,
    taskName: task.name ?? "Sin título",
    status: task.status?.status ?? "Sin estado",
    priority: task.priority?.priority ?? null,
    assignees: normalizeAssignees(task),
    dueDate: normalizeDueDate(task.due_date),
    taskUrl: task.url ?? null,
    rawPayload: task,
  }))
}
