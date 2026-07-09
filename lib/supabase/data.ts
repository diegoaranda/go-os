import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseClient } from "@/lib/supabase/client"
import type {
  Area,
  ClickUpMirrorAssignee,
  ClickUpMirrorTask,
  ContentAsset,
  ContentAssetFile,
  ContentAssetVersion,
  ContentPlanningItem,
  ContentPublishingItem,
  ContentPost,
  ContentResultItem,
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

export type CreateContentPlanningItemInput = Omit<
  ContentPlanningItem,
  "id" | "createdAt" | "updatedAt"
>
export type UpdateContentPlanningItemInput = Partial<CreateContentPlanningItemInput>

export type CreateContentPublishingItemInput = Omit<
  ContentPublishingItem,
  "id" | "createdAt" | "updatedAt"
>
export type UpdateContentPublishingItemInput = Partial<CreateContentPublishingItemInput>

export type CreateContentResultItemInput = Omit<
  ContentResultItem,
  "id" | "createdAt" | "updatedAt"
>
export type UpdateContentResultItemInput = Partial<CreateContentResultItemInput>

export type CreateContentAssetInput = Omit<
  ContentAsset,
  "id" | "currentVersionId" | "createdAt" | "updatedAt"
>
export type UpdateContentAssetInput = Partial<
  Omit<ContentAsset, "id" | "createdAt" | "updatedAt">
>
export type ListContentAssetsFilters = Partial<
  Pick<ContentAsset, "brand" | "assetType" | "status" | "channel">
>
export type CreateContentAssetVersionInput = Omit<
  ContentAssetVersion,
  "id" | "assetId" | "versionNumber" | "createdAt"
>
export type UpdateContentAssetVersionInput = Partial<CreateContentAssetVersionInput>
export type CreateContentAssetFileInput = Omit<
  ContentAssetFile,
  "id" | "assetId" | "createdAt"
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

type ContentPlanningItemRow = {
  id: string
  user_id: string
  brand: ContentPlanningItem["brand"]
  week_label: string
  target_date: string
  product_line: string
  goal: string
  format: string
  message_angle: string
  cta: string
  channel: string
  responsible: string
  planning_status: ContentPlanningItem["planningStatus"]
  notes: string | null
  created_at: string
  updated_at: string
}

type ContentPublishingItemRow = {
  id: string
  user_id: string
  planning_item_id: string | null
  brand: ContentPublishingItem["brand"]
  publish_date: string
  publish_time: string | null
  product_line: string
  channel: string
  final_copy: string
  asset_url: string | null
  publishing_status: ContentPublishingItem["publishingStatus"]
  notes: string | null
  created_at: string
  updated_at: string
}

type ContentResultItemRow = {
  id: string
  user_id: string
  publishing_item_id: string | null
  brand: ContentResultItem["brand"]
  week_label: string
  publish_date: string
  product_line: string
  reach: number
  impressions: number
  notes: string | null
  created_at: string
  updated_at: string
}

type ContentAssetRow = {
  id: string
  user_id: string
  brand: string
  title: string
  slug: string | null
  asset_type: string
  status: ContentAsset["status"]
  channel: string | null
  product_name: string | null
  campaign_name: string | null
  content_pillar: string | null
  objective: string | null
  current_version_id: string | null
  cover_image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type ContentAssetVersionRow = {
  id: string
  asset_id: string
  user_id: string
  version_number: number
  title: string | null
  hook: string | null
  body_copy: string | null
  caption: string | null
  cta: string | null
  hashtags: string | null
  offer_text: string | null
  design_brief: string | null
  image_url: string | null
  image_alt_urls: unknown
  status: ContentAssetVersion["status"]
  change_summary: string | null
  created_by: string | null
  created_at: string
}

type ContentAssetFileRow = {
  id: string
  asset_id: string
  version_id: string | null
  user_id: string
  file_type: string
  file_url: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  is_primary: boolean
  created_at: string
}

type ClickUpMirrorTaskRow = {
  id: string
  user_id: string
  source: string
  external_id: string
  list_id: string
  task_name: string
  status: string
  priority: string | null
  assignees_json: unknown
  due_date: string | null
  task_url: string | null
  raw_payload: unknown
  synced_at: string
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

type ContentPlanningItemMutationRow = Pick<
  ContentPlanningItemRow,
  | "user_id"
  | "brand"
  | "week_label"
  | "target_date"
  | "product_line"
  | "goal"
  | "format"
  | "message_angle"
  | "cta"
  | "channel"
  | "responsible"
  | "planning_status"
> & {
  notes: string | null
}

type ContentPublishingItemMutationRow = Pick<
  ContentPublishingItemRow,
  | "user_id"
  | "brand"
  | "publish_date"
  | "product_line"
  | "channel"
  | "final_copy"
  | "publishing_status"
> & {
  planning_item_id: string | null
  publish_time: string | null
  asset_url: string | null
  notes: string | null
}

type ContentResultItemMutationRow = Pick<
  ContentResultItemRow,
  "user_id" | "brand" | "week_label" | "publish_date" | "product_line" | "reach" | "impressions"
> & {
  publishing_item_id: string | null
  notes: string | null
}

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

type ContentAssetMutationRow = Pick<
  ContentAssetRow,
  | "user_id"
  | "brand"
  | "title"
  | "slug"
  | "asset_type"
  | "status"
  | "channel"
  | "product_name"
  | "campaign_name"
  | "content_pillar"
  | "objective"
  | "current_version_id"
  | "cover_image_url"
  | "notes"
>

type ContentAssetVersionMutationRow = Pick<
  ContentAssetVersionRow,
  | "asset_id"
  | "user_id"
  | "version_number"
  | "title"
  | "hook"
  | "body_copy"
  | "caption"
  | "cta"
  | "hashtags"
  | "offer_text"
  | "design_brief"
  | "image_url"
  | "status"
  | "change_summary"
  | "created_by"
> & {
  image_alt_urls: string[] | null
}

type ContentAssetFileMutationRow = Pick<
  ContentAssetFileRow,
  | "asset_id"
  | "version_id"
  | "user_id"
  | "file_type"
  | "file_url"
  | "file_name"
  | "mime_type"
  | "size_bytes"
  | "is_primary"
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

function mapContentPlanningItemRow(row: ContentPlanningItemRow): ContentPlanningItem {
  return {
    id: row.id,
    brand: row.brand,
    weekLabel: row.week_label,
    targetDate: row.target_date,
    productLine: row.product_line,
    goal: row.goal,
    format: row.format,
    messageAngle: row.message_angle,
    cta: row.cta,
    channel: row.channel,
    responsible: row.responsible,
    planningStatus: row.planning_status,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapContentPublishingItemRow(row: ContentPublishingItemRow): ContentPublishingItem {
  return {
    id: row.id,
    planningItemId: row.planning_item_id ?? "",
    brand: row.brand,
    publishDate: row.publish_date,
    publishTime: row.publish_time ?? "",
    productLine: row.product_line,
    channel: row.channel,
    finalCopy: row.final_copy,
    assetUrl: row.asset_url ?? "",
    publishingStatus: row.publishing_status,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapContentResultItemRow(row: ContentResultItemRow): ContentResultItem {
  return {
    id: row.id,
    publishingItemId: row.publishing_item_id ?? "",
    brand: row.brand,
    weekLabel: row.week_label,
    publishDate: row.publish_date,
    productLine: row.product_line,
    reach: row.reach,
    impressions: row.impressions,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => (typeof item === "string" ? [item] : []))
}

function mapContentAssetRow(row: ContentAssetRow): ContentAsset {
  return {
    id: row.id,
    brand: row.brand,
    title: row.title,
    slug: row.slug ?? "",
    assetType: row.asset_type,
    status: row.status,
    channel: row.channel ?? "",
    productName: row.product_name ?? "",
    campaignName: row.campaign_name ?? "",
    contentPillar: row.content_pillar ?? "",
    objective: row.objective ?? "",
    currentVersionId: row.current_version_id ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapContentAssetVersionRow(row: ContentAssetVersionRow): ContentAssetVersion {
  return {
    id: row.id,
    assetId: row.asset_id,
    versionNumber: row.version_number,
    title: row.title ?? "",
    hook: row.hook ?? "",
    bodyCopy: row.body_copy ?? "",
    caption: row.caption ?? "",
    cta: row.cta ?? "",
    hashtags: row.hashtags ?? "",
    offerText: row.offer_text ?? "",
    designBrief: row.design_brief ?? "",
    imageUrl: row.image_url ?? "",
    imageAltUrls: normalizeStringArray(row.image_alt_urls),
    status: row.status,
    changeSummary: row.change_summary ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
  }
}

function mapContentAssetFileRow(row: ContentAssetFileRow): ContentAssetFile {
  return {
    id: row.id,
    assetId: row.asset_id,
    versionId: row.version_id ?? "",
    fileType: row.file_type,
    fileUrl: row.file_url,
    fileName: row.file_name,
    mimeType: row.mime_type ?? "",
    sizeBytes: row.size_bytes,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  }
}

function normalizeClickUpAssignees(value: unknown): ClickUpMirrorAssignee[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((assignee) => {
    if (!isRecord(assignee)) return []

    const id = assignee.id
    const name = assignee.name
    const email = assignee.email

    if ((typeof id !== "string" && typeof id !== "number") || typeof name !== "string") {
      return []
    }

    return [
      {
        id: String(id),
        name,
        email: typeof email === "string" ? email : undefined,
      },
    ]
  })
}

function mapClickUpMirrorTaskRow(row: ClickUpMirrorTaskRow): ClickUpMirrorTask {
  return {
    id: row.id,
    externalId: row.external_id,
    listId: row.list_id,
    taskName: row.task_name,
    status: row.status,
    priority: row.priority ?? "",
    assignees: normalizeClickUpAssignees(row.assignees_json),
    dueDate: row.due_date ?? "",
    taskUrl: row.task_url ?? "",
    syncedAt: row.synced_at,
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

function mapContentPlanningItemInput(
  input: CreateContentPlanningItemInput,
  userId: string,
): ContentPlanningItemMutationRow {
  return {
    user_id: userId,
    brand: input.brand,
    week_label: input.weekLabel,
    target_date: input.targetDate,
    product_line: input.productLine,
    goal: input.goal,
    format: input.format,
    message_angle: input.messageAngle,
    cta: input.cta,
    channel: input.channel,
    responsible: input.responsible,
    planning_status: input.planningStatus,
    notes: input.notes || null,
  }
}

function mapContentPlanningItemUpdate(input: UpdateContentPlanningItemInput) {
  const update: Partial<ContentPlanningItemMutationRow> = {}

  if (input.brand !== undefined) update.brand = input.brand
  if (input.weekLabel !== undefined) update.week_label = input.weekLabel
  if (input.targetDate !== undefined) update.target_date = input.targetDate
  if (input.productLine !== undefined) update.product_line = input.productLine
  if (input.goal !== undefined) update.goal = input.goal
  if (input.format !== undefined) update.format = input.format
  if (input.messageAngle !== undefined) update.message_angle = input.messageAngle
  if (input.cta !== undefined) update.cta = input.cta
  if (input.channel !== undefined) update.channel = input.channel
  if (input.responsible !== undefined) update.responsible = input.responsible
  if (input.planningStatus !== undefined) update.planning_status = input.planningStatus
  if (input.notes !== undefined) update.notes = input.notes || null

  return update
}

function mapContentPublishingItemInput(
  input: CreateContentPublishingItemInput,
  userId: string,
): ContentPublishingItemMutationRow {
  return {
    user_id: userId,
    planning_item_id: input.planningItemId || null,
    brand: input.brand,
    publish_date: input.publishDate,
    publish_time: input.publishTime || null,
    product_line: input.productLine,
    channel: input.channel,
    final_copy: input.finalCopy,
    asset_url: input.assetUrl || null,
    publishing_status: input.publishingStatus,
    notes: input.notes || null,
  }
}

function mapContentPublishingItemUpdate(input: UpdateContentPublishingItemInput) {
  const update: Partial<ContentPublishingItemMutationRow> = {}

  if (input.planningItemId !== undefined) update.planning_item_id = input.planningItemId || null
  if (input.brand !== undefined) update.brand = input.brand
  if (input.publishDate !== undefined) update.publish_date = input.publishDate
  if (input.publishTime !== undefined) update.publish_time = input.publishTime || null
  if (input.productLine !== undefined) update.product_line = input.productLine
  if (input.channel !== undefined) update.channel = input.channel
  if (input.finalCopy !== undefined) update.final_copy = input.finalCopy
  if (input.assetUrl !== undefined) update.asset_url = input.assetUrl || null
  if (input.publishingStatus !== undefined) update.publishing_status = input.publishingStatus
  if (input.notes !== undefined) update.notes = input.notes || null

  return update
}

function mapContentResultItemInput(
  input: CreateContentResultItemInput,
  userId: string,
): ContentResultItemMutationRow {
  return {
    user_id: userId,
    publishing_item_id: input.publishingItemId || null,
    brand: input.brand,
    week_label: input.weekLabel,
    publish_date: input.publishDate,
    product_line: input.productLine,
    reach: input.reach,
    impressions: input.impressions,
    notes: input.notes || null,
  }
}

function mapContentResultItemUpdate(input: UpdateContentResultItemInput) {
  const update: Partial<ContentResultItemMutationRow> = {}

  if (input.publishingItemId !== undefined) update.publishing_item_id = input.publishingItemId || null
  if (input.brand !== undefined) update.brand = input.brand
  if (input.weekLabel !== undefined) update.week_label = input.weekLabel
  if (input.publishDate !== undefined) update.publish_date = input.publishDate
  if (input.productLine !== undefined) update.product_line = input.productLine
  if (input.reach !== undefined) update.reach = input.reach
  if (input.impressions !== undefined) update.impressions = input.impressions
  if (input.notes !== undefined) update.notes = input.notes || null

  return update
}

function mapContentAssetInput(
  input: CreateContentAssetInput,
  userId: string,
): ContentAssetMutationRow {
  return {
    user_id: userId,
    brand: input.brand,
    title: input.title,
    slug: input.slug || null,
    asset_type: input.assetType,
    status: input.status,
    channel: input.channel || null,
    product_name: input.productName || null,
    campaign_name: input.campaignName || null,
    content_pillar: input.contentPillar || null,
    objective: input.objective || null,
    current_version_id: null,
    cover_image_url: input.coverImageUrl || null,
    notes: input.notes || null,
  }
}

function mapContentAssetUpdate(input: UpdateContentAssetInput) {
  const update: Partial<ContentAssetMutationRow> = {}

  if (input.brand !== undefined) update.brand = input.brand
  if (input.title !== undefined) update.title = input.title
  if (input.slug !== undefined) update.slug = input.slug || null
  if (input.assetType !== undefined) update.asset_type = input.assetType
  if (input.status !== undefined) update.status = input.status
  if (input.channel !== undefined) update.channel = input.channel || null
  if (input.productName !== undefined) update.product_name = input.productName || null
  if (input.campaignName !== undefined) update.campaign_name = input.campaignName || null
  if (input.contentPillar !== undefined) update.content_pillar = input.contentPillar || null
  if (input.objective !== undefined) update.objective = input.objective || null
  if (input.currentVersionId !== undefined) update.current_version_id = input.currentVersionId || null
  if (input.coverImageUrl !== undefined) update.cover_image_url = input.coverImageUrl || null
  if (input.notes !== undefined) update.notes = input.notes || null

  return update
}

function mapContentAssetVersionInput(
  assetId: string,
  input: CreateContentAssetVersionInput,
  userId: string,
  versionNumber: number,
): ContentAssetVersionMutationRow {
  return {
    asset_id: assetId,
    user_id: userId,
    version_number: versionNumber,
    title: input.title || null,
    hook: input.hook || null,
    body_copy: input.bodyCopy || null,
    caption: input.caption || null,
    cta: input.cta || null,
    hashtags: input.hashtags || null,
    offer_text: input.offerText || null,
    design_brief: input.designBrief || null,
    image_url: input.imageUrl || null,
    image_alt_urls: input.imageAltUrls.length > 0 ? input.imageAltUrls : null,
    status: input.status,
    change_summary: input.changeSummary || null,
    created_by: input.createdBy || null,
  }
}

function mapContentAssetVersionUpdate(input: UpdateContentAssetVersionInput) {
  const update: Partial<Omit<ContentAssetVersionMutationRow, "asset_id" | "user_id" | "version_number">> = {}

  if (input.title !== undefined) update.title = input.title || null
  if (input.hook !== undefined) update.hook = input.hook || null
  if (input.bodyCopy !== undefined) update.body_copy = input.bodyCopy || null
  if (input.caption !== undefined) update.caption = input.caption || null
  if (input.cta !== undefined) update.cta = input.cta || null
  if (input.hashtags !== undefined) update.hashtags = input.hashtags || null
  if (input.offerText !== undefined) update.offer_text = input.offerText || null
  if (input.designBrief !== undefined) update.design_brief = input.designBrief || null
  if (input.imageUrl !== undefined) update.image_url = input.imageUrl || null
  if (input.imageAltUrls !== undefined) {
    update.image_alt_urls = input.imageAltUrls.length > 0 ? input.imageAltUrls : null
  }
  if (input.status !== undefined) update.status = input.status
  if (input.changeSummary !== undefined) update.change_summary = input.changeSummary || null
  if (input.createdBy !== undefined) update.created_by = input.createdBy || null

  return update
}

function mapContentAssetFileInput(
  assetId: string,
  input: CreateContentAssetFileInput,
  userId: string,
): ContentAssetFileMutationRow {
  return {
    asset_id: assetId,
    version_id: input.versionId || null,
    user_id: userId,
    file_type: input.fileType,
    file_url: input.fileUrl,
    file_name: input.fileName,
    mime_type: input.mimeType || null,
    size_bytes: input.sizeBytes,
    is_primary: input.isPrimary,
  }
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

export async function listContentAssets(filters: ListContentAssetsFilters = {}) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  let query = client
    .from("content_assets")
    .select("*")
    .eq("user_id", userId)

  if (filters.brand) query = query.eq("brand", filters.brand)
  if (filters.assetType) query = query.eq("asset_type", filters.assetType)
  if (filters.status) query = query.eq("status", filters.status)
  if (filters.channel) query = query.eq("channel", filters.channel)

  const { data, error } = await query.order("updated_at", { ascending: false })

  if (error) throw error

  return (data as ContentAssetRow[]).map(mapContentAssetRow)
}

export async function getContentAsset(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_assets")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapContentAssetRow(data as ContentAssetRow)
}

export async function createContentAsset(input: CreateContentAssetInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_assets")
    .insert(mapContentAssetInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapContentAssetRow(data as ContentAssetRow)
}

export async function updateContentAsset(
  id: string,
  input: UpdateContentAssetInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapContentAssetUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("content_assets")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("content_assets").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapContentAssetRow(data as ContentAssetRow)
}

export async function deleteContentAsset(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("content_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listContentAssetVersions(assetId: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_asset_versions")
    .select("*")
    .eq("asset_id", assetId)
    .eq("user_id", userId)
    .order("version_number", { ascending: false })

  if (error) throw error

  return (data as ContentAssetVersionRow[]).map(mapContentAssetVersionRow)
}

export async function createContentAssetVersion(
  assetId: string,
  input: CreateContentAssetVersionInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data: assetData, error: assetError } = await client
    .from("content_assets")
    .select("id,current_version_id")
    .eq("id", assetId)
    .eq("user_id", userId)
    .single()

  if (assetError) throw assetError

  const { data: latestData, error: latestError } = await client
    .from("content_asset_versions")
    .select("version_number")
    .eq("asset_id", assetId)
    .eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(1)

  if (latestError) throw latestError

  const latestVersion = (latestData as Pick<ContentAssetVersionRow, "version_number">[])[0]
  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1

  const { data, error } = await client
    .from("content_asset_versions")
    .insert(mapContentAssetVersionInput(assetId, input, userId, nextVersionNumber))
    .select("*")
    .single()

  if (error) throw error

  const version = mapContentAssetVersionRow(data as ContentAssetVersionRow)

  if (!(assetData as { current_version_id: string | null }).current_version_id) {
    await setContentAssetCurrentVersion(assetId, version.id)
  }

  return version
}

export async function updateContentAssetVersion(
  versionId: string,
  input: UpdateContentAssetVersionInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapContentAssetVersionUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("content_asset_versions")
          .update(update)
          .eq("id", versionId)
          .eq("user_id", userId)
          .select("*")
      : client
          .from("content_asset_versions")
          .select("*")
          .eq("id", versionId)
          .eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapContentAssetVersionRow(data as ContentAssetVersionRow)
}

export async function setContentAssetCurrentVersion(
  assetId: string,
  versionId: string,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data: versionData, error: versionError } = await client
    .from("content_asset_versions")
    .select("id")
    .eq("id", versionId)
    .eq("asset_id", assetId)
    .eq("user_id", userId)
    .single()

  if (versionError) throw versionError
  if (!versionData) throw new Error("No se encontró la versión.")

  const { data, error } = await client
    .from("content_assets")
    .update({ current_version_id: versionId })
    .eq("id", assetId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error

  return mapContentAssetRow(data as ContentAssetRow)
}

export async function listContentAssetFiles(assetId: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_asset_files")
    .select("*")
    .eq("asset_id", assetId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as ContentAssetFileRow[]).map(mapContentAssetFileRow)
}

export async function createContentAssetFile(
  assetId: string,
  input: CreateContentAssetFileInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_asset_files")
    .insert(mapContentAssetFileInput(assetId, input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapContentAssetFileRow(data as ContentAssetFileRow)
}

export async function deleteContentAssetFile(fileId: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("content_asset_files")
    .delete()
    .eq("id", fileId)
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

export async function listContentPlanningItems() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_planning_items")
    .select("*")
    .eq("user_id", userId)
    .order("target_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as ContentPlanningItemRow[]).map(mapContentPlanningItemRow)
}

export async function createContentPlanningItem(input: CreateContentPlanningItemInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_planning_items")
    .insert(mapContentPlanningItemInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapContentPlanningItemRow(data as ContentPlanningItemRow)
}

export async function updateContentPlanningItem(
  id: string,
  input: UpdateContentPlanningItemInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapContentPlanningItemUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("content_planning_items")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("content_planning_items").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapContentPlanningItemRow(data as ContentPlanningItemRow)
}

export async function deleteContentPlanningItem(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("content_planning_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listContentPublishingItems() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_publishing_items")
    .select("*")
    .eq("user_id", userId)
    .order("publish_date", { ascending: true })
    .order("publish_time", { ascending: true })

  if (error) throw error

  return (data as ContentPublishingItemRow[]).map(mapContentPublishingItemRow)
}

export async function createContentPublishingItem(input: CreateContentPublishingItemInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_publishing_items")
    .insert(mapContentPublishingItemInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapContentPublishingItemRow(data as ContentPublishingItemRow)
}

export async function updateContentPublishingItem(
  id: string,
  input: UpdateContentPublishingItemInput,
) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapContentPublishingItemUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("content_publishing_items")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("content_publishing_items").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapContentPublishingItemRow(data as ContentPublishingItemRow)
}

export async function deleteContentPublishingItem(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("content_publishing_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listContentResultItems() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_results")
    .select("*")
    .eq("user_id", userId)
    .order("publish_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data as ContentResultItemRow[]).map(mapContentResultItemRow)
}

export async function createContentResultItem(input: CreateContentResultItemInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("content_results")
    .insert(mapContentResultItemInput(input, userId))
    .select("*")
    .single()

  if (error) throw error

  return mapContentResultItemRow(data as ContentResultItemRow)
}

export async function updateContentResultItem(id: string, input: UpdateContentResultItemInput) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const update = mapContentResultItemUpdate(input)
  const query =
    Object.keys(update).length > 0
      ? client
          .from("content_results")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
      : client.from("content_results").select("*").eq("id", id).eq("user_id", userId)

  const { data, error } = await query.single()

  if (error) throw error

  return mapContentResultItemRow(data as ContentResultItemRow)
}

export async function deleteContentResultItem(id: string) {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { error } = await client
    .from("content_results")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
}

export async function listClickUpMirrorTasks() {
  const client = getSupabaseClient()
  const userId = await getAuthenticatedUserId(client)
  const { data, error } = await client
    .from("clickup_mirror_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false })

  if (error) throw error

  return (data as ClickUpMirrorTaskRow[]).map(mapClickUpMirrorTaskRow)
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
