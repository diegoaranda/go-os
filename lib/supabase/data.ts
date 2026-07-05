import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseClient } from "@/lib/supabase/client"
import type {
  Area,
  ContentPost,
  InboxItem,
  KnowledgeLibraryItem,
  Project,
  Task,
  WeeklyReview,
} from "@/lib/types"

export type CreateAreaInput = Omit<Area, "id">
export type UpdateAreaInput = Partial<Omit<Area, "id">>

export type CreateProjectInput = Omit<Project, "id">
export type UpdateProjectInput = Partial<Omit<Project, "id">>

export type CreateTaskInput = Omit<Task, "id">
export type UpdateTaskInput = Partial<Omit<Task, "id">>

export type CreateInboxItemInput = Pick<InboxItem, "content"> &
  Partial<Pick<InboxItem, "suggestedProject" | "archived">>
export type UpdateInboxItemInput = Partial<
  Pick<InboxItem, "content" | "suggestedProject" | "archived">
>

export type CreateLibraryItemInput = Omit<KnowledgeLibraryItem, "id" | "createdAt">
export type UpdateLibraryItemInput = Partial<Omit<KnowledgeLibraryItem, "id" | "createdAt">>

export type CreateContentPostInput = Omit<ContentPost, "id" | "createdAt" | "updatedAt">
export type UpdateContentPostInput = Partial<
  Omit<ContentPost, "id" | "createdAt" | "updatedAt">
>

export type UpsertWeeklyReviewInput = Pick<WeeklyReview, "weekStart" | "note">

type ProjectRow = {
  id: string
  user_id: string
  name: string
  area_id: string | null
  client: string
  status: Project["status"]
  priority: Project["priority"]
  next_action: string
  progress: number
  links: unknown
  created_at: string
  updated_at: string
}

type AreaRow = {
  id: string
  user_id: string
  name: string
  created_at: string
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

type LibraryItemRow = {
  id: string
  user_id: string
  title: string
  type: KnowledgeLibraryItem["type"]
  content: string | null
  url: string | null
  area_id: string | null
  project_id: string | null
  created_at: string
}

type WeeklyReviewRow = {
  id: string
  user_id: string
  week_start: string
  note: string
  created_at: string
  updated_at: string
}

type ContentPostRow = {
  id: string
  user_id: string
  title: string
  description: string
  publish_date: string
  channel: string
  status: ContentPost["status"]
  project_id: string | null
  area_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type ProjectMutationRow = Pick<
  ProjectRow,
  | "user_id"
  | "name"
  | "area_id"
  | "client"
  | "status"
  | "priority"
  | "next_action"
  | "progress"
> & {
  links: Project["links"]
}

type AreaMutationRow = Pick<AreaRow, "user_id" | "name">

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

type LibraryItemMutationRow = Pick<
  LibraryItemRow,
  "user_id" | "title" | "type" | "content" | "url" | "area_id" | "project_id"
>

type ContentPostMutationRow = Pick<
  ContentPostRow,
  | "user_id"
  | "title"
  | "description"
  | "publish_date"
  | "channel"
  | "status"
  | "project_id"
  | "area_id"
  | "notes"
>

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
    areaId: row.area_id ?? "",
    client: row.client,
    status: row.status,
    priority: row.priority,
    nextAction: row.next_action,
    progress: row.progress,
    links: normalizeProjectLinks(row.links),
  }
}

function mapAreaRow(row: AreaRow): Area {
  return {
    id: row.id,
    name: row.name,
  }
}

function mapAreaInput(input: CreateAreaInput, userId: string): AreaMutationRow {
  return {
    user_id: userId,
    name: input.name,
  }
}

function mapAreaUpdate(input: UpdateAreaInput) {
  const update: Partial<AreaMutationRow> = {}

  if (input.name !== undefined) update.name = input.name

  return update
}

function mapProjectInput(
  input: CreateProjectInput,
  userId: string,
): ProjectMutationRow {
  return {
    user_id: userId,
    name: input.name,
    area_id: input.areaId || null,
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
  if (input.areaId !== undefined) update.area_id = input.areaId || null
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

function mapLibraryItemRow(row: LibraryItemRow): KnowledgeLibraryItem {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    content: row.content ?? "",
    url: row.url ?? "",
    areaId: row.area_id ?? "",
    projectId: row.project_id ?? "",
    createdAt: row.created_at,
  }
}

function mapLibraryItemInput(
  input: CreateLibraryItemInput,
  userId: string,
): LibraryItemMutationRow {
  return {
    user_id: userId,
    title: input.title,
    type: input.type,
    content: input.content || null,
    url: input.url || null,
    area_id: input.areaId || null,
    project_id: input.projectId || null,
  }
}

function mapLibraryItemUpdate(input: UpdateLibraryItemInput) {
  const update: Partial<LibraryItemMutationRow> = {}

  if (input.title !== undefined) update.title = input.title
  if (input.type !== undefined) update.type = input.type
  if (input.content !== undefined) update.content = input.content || null
  if (input.url !== undefined) update.url = input.url || null
  if (input.areaId !== undefined) update.area_id = input.areaId || null
  if (input.projectId !== undefined) update.project_id = input.projectId || null

  return update
}

function mapWeeklyReviewRow(row: WeeklyReviewRow): WeeklyReview {
  return {
    id: row.id,
    weekStart: row.week_start,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapContentPostRow(row: ContentPostRow): ContentPost {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    publishDate: row.publish_date,
    channel: row.channel,
    status: row.status,
    projectId: row.project_id ?? "",
    areaId: row.area_id ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapContentPostInput(
  input: CreateContentPostInput,
  userId: string,
): ContentPostMutationRow {
  return {
    user_id: userId,
    title: input.title,
    description: input.description,
    publish_date: input.publishDate,
    channel: input.channel,
    status: input.status,
    project_id: input.projectId || null,
    area_id: input.areaId || null,
    notes: input.notes || null,
  }
}

function mapContentPostUpdate(input: UpdateContentPostInput) {
  const update: Partial<ContentPostMutationRow> = {}

  if (input.title !== undefined) update.title = input.title
  if (input.description !== undefined) update.description = input.description
  if (input.publishDate !== undefined) update.publish_date = input.publishDate
  if (input.channel !== undefined) update.channel = input.channel
  if (input.status !== undefined) update.status = input.status
  if (input.projectId !== undefined) update.project_id = input.projectId || null
  if (input.areaId !== undefined) update.area_id = input.areaId || null
  if (input.notes !== undefined) update.notes = input.notes || null

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

export async function listProjectsCreatedBefore(endIso: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .lt("created_at", endIso)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data as ProjectRow[]).map(mapProjectRow)
}

export async function listAreas() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("areas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data as AreaRow[]).map(mapAreaRow)
}

export async function createArea(input: CreateAreaInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("areas")
    .insert(mapAreaInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapAreaRow(data as AreaRow)
}

export async function updateArea(id: string, input: UpdateAreaInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapAreaUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("areas")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("areas").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapAreaRow(data as AreaRow)
}

export async function deleteArea(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("areas")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
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

export async function listTasksCreatedBefore(endIso: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .lt("created_at", endIso)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data as TaskRow[]).map(mapTaskRow)
}

export async function listCompletedTasksSince(sinceIso: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "Terminado")
    .gte("updated_at", sinceIso)
    .order("updated_at", { ascending: false })

  if (error) throw error

  return (data as TaskRow[]).map(mapTaskRow)
}

export async function listCompletedTasksBetween(startIso: string, endIso: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "Terminado")
    .gte("updated_at", startIso)
    .lt("updated_at", endIso)
    .order("updated_at", { ascending: false })

  if (error) throw error

  return (data as TaskRow[]).map(mapTaskRow)
}

export async function listActiveTodayTasks() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "Terminado")
    .order("created_at", { ascending: false })

  if (error) throw error

  return [...(data as TaskRow[])]
    .sort((a, b) => {
      const statusOrder = (status: Task["status"]) => {
        if (status === "En curso") return 0
        if (status === "Pendiente") return 1
        return 2
      }

      return statusOrder(a.status) - statusOrder(b.status)
    })
    .map(mapTaskRow)
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

export async function listInboxItemsCreatedBefore(endIso: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("inbox_items")
    .select("*")
    .eq("user_id", userId)
    .lt("created_at", endIso)
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

export async function listLibraryItems() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("library_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as LibraryItemRow[]).map(mapLibraryItemRow)
}

export async function listLibraryItemsByArea(areaId: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("library_items")
    .select("*")
    .eq("user_id", userId)
    .eq("area_id", areaId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as LibraryItemRow[]).map(mapLibraryItemRow)
}

export async function listLibraryItemsByProject(projectId: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("library_items")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as LibraryItemRow[]).map(mapLibraryItemRow)
}

export async function createLibraryItem(input: CreateLibraryItemInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("library_items")
    .insert(mapLibraryItemInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapLibraryItemRow(data as LibraryItemRow)
}

export async function updateLibraryItem(
  id: string,
  input: UpdateLibraryItemInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapLibraryItemUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("library_items")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("library_items").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapLibraryItemRow(data as LibraryItemRow)
}

export async function deleteLibraryItem(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("library_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listContentPosts() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_posts")
    .select("*")
    .eq("user_id", userId)
    .order("publish_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as ContentPostRow[]).map(mapContentPostRow)
}

export async function createContentPost(input: CreateContentPostInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_posts")
    .insert(mapContentPostInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapContentPostRow(data as ContentPostRow)
}

export async function updateContentPost(
  id: string,
  input: UpdateContentPostInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapContentPostUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("content_posts")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("content_posts").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapContentPostRow(data as ContentPostRow)
}

export async function deleteContentPost(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("content_posts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function getWeeklyReview(weekStart: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapWeeklyReviewRow(data as WeeklyReviewRow)
}

export async function getWeeklyReviewByWeek(weekStart: string) {
  return getWeeklyReview(weekStart)
}

export async function listRecentWeeklyReviews() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5)

  if (error) throw error

  return (data as WeeklyReviewRow[]).map(mapWeeklyReviewRow)
}

export async function upsertWeeklyReview(input: UpsertWeeklyReviewInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("weekly_reviews")
    .upsert(
      {
        user_id: userId,
        week_start: input.weekStart,
        note: input.note,
      },
      { onConflict: "user_id,week_start" },
    )
    .select("*")
    .single()

  if (error) throw error

  return mapWeeklyReviewRow(data as WeeklyReviewRow)
}
