import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseClient } from "@/lib/supabase/client"
import type { InboxItem, Project, Task } from "@/lib/types"

export type CreateProjectInput = Omit<Project, "id">
export type UpdateProjectInput = Partial<Omit<Project, "id">>

export type CreateTaskInput = Omit<Task, "id">
export type UpdateTaskInput = Partial<Omit<Task, "id">>

export type CreateInboxItemInput = Pick<InboxItem, "content"> &
  Partial<Pick<InboxItem, "suggestedProject" | "archived">>
export type UpdateInboxItemInput = Partial<
  Pick<InboxItem, "content" | "suggestedProject" | "archived">
>

type ProjectRow = {
  id: string
  user_id: string
  name: string
  client: string
  status: Project["status"]
  priority: Project["priority"]
  next_action: string
  progress: number
  links: unknown
  created_at: string
  updated_at: string
}

type TaskRow = {
  id: string
  user_id: string
  project_id: string
  title: string
  status: Task["status"]
  priority: Task["priority"]
  due: string
  source: Task["source"]
  created_at: string
  updated_at: string
}

type InboxItemRow = {
  id: string
  user_id: string
  content: string
  suggested_project_id: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

type ProjectMutationRow = Pick<
  ProjectRow,
  | "user_id"
  | "name"
  | "client"
  | "status"
  | "priority"
  | "next_action"
  | "progress"
> & {
  links: Project["links"]
}

type TaskMutationRow = Pick<
  TaskRow,
  "user_id" | "project_id" | "title" | "status" | "priority" | "due" | "source"
>

type InboxItemMutationRow = Pick<
  InboxItemRow,
  "user_id" | "content" | "archived"
> & {
  suggested_project_id: string | null
}

async function getAuthenticatedUserId(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser()

  if (error) throw error
  if (!data.user) {
    throw new Error("No authenticated Supabase user.")
  }

  return data.user.id
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeProjectLinks(value: unknown): Project["links"] {
  if (!Array.isArray(value)) return []

  return value.flatMap((link) => {
    if (
      !isRecord(link) ||
      typeof link.label !== "string" ||
      typeof link.href !== "string"
    ) {
      return []
    }

    return [{ label: link.label, href: link.href }]
  })
}

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    status: row.status,
    priority: row.priority,
    nextAction: row.next_action,
    progress: row.progress,
    links: normalizeProjectLinks(row.links),
  }
}

function mapProjectInput(
  input: CreateProjectInput,
  userId: string,
): ProjectMutationRow {
  return {
    user_id: userId,
    name: input.name,
    client: input.client,
    status: input.status,
    priority: input.priority,
    next_action: input.nextAction,
    progress: input.progress,
    links: input.links,
  }
}

function mapProjectUpdate(input: UpdateProjectInput) {
  const update: Partial<ProjectMutationRow> = {}

  if (input.name !== undefined) update.name = input.name
  if (input.client !== undefined) update.client = input.client
  if (input.status !== undefined) update.status = input.status
  if (input.priority !== undefined) update.priority = input.priority
  if (input.nextAction !== undefined) update.next_action = input.nextAction
  if (input.progress !== undefined) update.progress = input.progress
  if (input.links !== undefined) update.links = input.links

  return update
}

function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    projectId: row.project_id,
    due: row.due,
    source: row.source,
  }
}

function mapTaskInput(input: CreateTaskInput, userId: string): TaskMutationRow {
  return {
    user_id: userId,
    project_id: input.projectId,
    title: input.title,
    status: input.status,
    priority: input.priority,
    due: input.due,
    source: input.source,
  }
}

function mapTaskUpdate(input: UpdateTaskInput) {
  const update: Partial<TaskMutationRow> = {}

  if (input.projectId !== undefined) update.project_id = input.projectId
  if (input.title !== undefined) update.title = input.title
  if (input.status !== undefined) update.status = input.status
  if (input.priority !== undefined) update.priority = input.priority
  if (input.due !== undefined) update.due = input.due
  if (input.source !== undefined) update.source = input.source

  return update
}

function mapInboxItemRow(row: InboxItemRow): InboxItem {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    suggestedProject: row.suggested_project_id ?? "",
    archived: row.archived,
  }
}

function mapInboxItemInput(
  input: CreateInboxItemInput,
  userId: string,
): InboxItemMutationRow {
  return {
    user_id: userId,
    content: input.content,
    suggested_project_id: input.suggestedProject ?? null,
    archived: input.archived ?? false,
  }
}

function mapInboxItemUpdate(input: UpdateInboxItemInput) {
  const update: Partial<InboxItemMutationRow> = {}

  if (input.content !== undefined) update.content = input.content
  if (input.suggestedProject !== undefined) {
    update.suggested_project_id = input.suggestedProject || null
  }
  if (input.archived !== undefined) update.archived = input.archived

  return update
}

export async function listProjects() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data as ProjectRow[]).map(mapProjectRow)
}

export async function createProject(input: CreateProjectInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("projects")
    .insert(mapProjectInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapProjectRow(data as ProjectRow)
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapProjectUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("projects")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("projects").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapProjectRow(data as ProjectRow)
}

export async function deleteProject(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listTasks() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data as TaskRow[]).map(mapTaskRow)
}

export async function createTask(input: CreateTaskInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("tasks")
    .insert(mapTaskInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapTaskRow(data as TaskRow)
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapTaskUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("tasks")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("tasks").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapTaskRow(data as TaskRow)
}

export async function deleteTask(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listInboxItems() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("inbox_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as InboxItemRow[]).map(mapInboxItemRow)
}

export async function createInboxItem(input: CreateInboxItemInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("inbox_items")
    .insert(mapInboxItemInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapInboxItemRow(data as InboxItemRow)
}

export async function updateInboxItem(
  id: string,
  input: UpdateInboxItemInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapInboxItemUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("inbox_items")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("inbox_items").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapInboxItemRow(data as InboxItemRow)
}

export async function deleteInboxItem(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("inbox_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}
