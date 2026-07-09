export type Priority = "Alta" | "Media" | "Baja"

export type ProjectStatus = "Activo" | "En pausa" | "Planificación" | "Completado"

export type TaskStatus =
  | "Pendiente"
  | "En curso"
  | "En revisión"
  | "Bloqueado"
  | "Terminado"

export type TaskSource = "Manual" | "ClickUp" | "Inbox"

export type LibraryItemType = "note" | "link" | "resource" | "email"

export type ContentPostStatus =
  | "Idea"
  | "Pendiente"
  | "Diseñado"
  | "Programado"
  | "Publicado"
  | "Cancelado"

export type ContentBrand =
  | "Rey del Abasto"
  | "Sudamerican"
  | "Inmobiliaria"
  | "Medalleros"
  | "Marca personal"

export type ContentPlanningStatus =
  | "pendiente de producción"
  | "en diseño"
  | "copy listo"
  | "listo para programar"

export type ContentPublishingStatus = "pendiente" | "programado" | "publicado"

export type ContentAssetStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived"

export type ContentAssetVersionStatus =
  | "draft"
  | "approved"
  | "rejected"
  | "published"

export type ContentAssetType =
  | "product_copy"
  | "campaign_post"
  | "catalog_copy"
  | "whatsapp_copy"
  | "ad_creative"
  | "web_copy"

export type ContentAssetChannel =
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "web"
  | "meta_ads"
  | "email"

export type Area = {
  id: string
  name: string
}

export type Project = {
  id: string
  name: string
  areaId?: string
  client: string
  status: ProjectStatus
  priority: Priority
  nextAction: string
  progress: number
  links: { label: string; href: string }[]
}

export type Task = {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  projectId: string
  due: string
  source: TaskSource
}

export type InboxItem = {
  id: string
  content: string
  createdAt: string
  suggestedProject: string
  archived?: boolean
}

export type KnowledgeLibraryItem = {
  id: string
  title: string
  type: LibraryItemType
  content: string
  url: string
  areaId: string
  projectId: string
  createdAt: string
}

export type WeeklyReview = {
  id: string
  weekStart: string
  note: string
  createdAt: string
  updatedAt: string
}

export type ContentPost = {
  id: string
  title: string
  description: string
  publishDate: string
  channel: string
  status: ContentPostStatus
  projectId: string
  areaId: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContentPlanningItem = {
  id: string
  brand: ContentBrand
  weekLabel: string
  targetDate: string
  productLine: string
  goal: string
  format: string
  messageAngle: string
  cta: string
  channel: string
  responsible: string
  planningStatus: ContentPlanningStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContentPublishingItem = {
  id: string
  planningItemId: string
  brand: ContentBrand
  publishDate: string
  publishTime: string
  productLine: string
  channel: string
  finalCopy: string
  assetUrl: string
  publishingStatus: ContentPublishingStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContentResultItem = {
  id: string
  publishingItemId: string
  brand: ContentBrand
  weekLabel: string
  publishDate: string
  productLine: string
  reach: number
  impressions: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContentAsset = {
  id: string
  brand: string
  title: string
  slug: string
  assetType: ContentAssetType | string
  status: ContentAssetStatus
  channel: ContentAssetChannel | string
  productName: string
  campaignName: string
  contentPillar: string
  objective: string
  currentVersionId: string
  coverImageUrl: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContentAssetVersion = {
  id: string
  assetId: string
  versionNumber: number
  title: string
  hook: string
  bodyCopy: string
  caption: string
  cta: string
  hashtags: string
  offerText: string
  designBrief: string
  imageUrl: string
  imageAltUrls: string[]
  status: ContentAssetVersionStatus
  changeSummary: string
  createdBy: string
  createdAt: string
}

export type ContentAssetFile = {
  id: string
  assetId: string
  versionId: string
  fileType: string
  fileUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number | null
  isPrimary: boolean
  createdAt: string
}

export type ClickUpMirrorAssignee = {
  id: string
  name: string
  email?: string
}

export type ClickUpMirrorTask = {
  id: string
  externalId: string
  listId: string
  taskName: string
  status: string
  priority: string
  assignees: ClickUpMirrorAssignee[]
  dueDate: string
  taskUrl: string
  syncedAt: string
}

export type RdaContentStatus =
  | "Programado"
  | "En revisión"
  | "En pausa"
  | "Listo"

export type RdaContentItem = {
  id: string
  product: string
  format: string
  channel: string
  status: RdaContentStatus
  publishDate: string
  notes: string
}

export type ContentStatus = RdaContentStatus
export type ContentItem = RdaContentItem

export type CopyStatus = "Borrador" | "Aprobado" | "Publicado"

export type AssetType = "Imagen" | "PDF" | "Mockup" | "Referencia"

type BaseLibraryItem = {
  id: string
  title: string
  projectId: string
  date: string
  tags: string[]
}

export type LibraryCopyItem = BaseLibraryItem & {
  kind: "copy"
  preview: string
  status: CopyStatus
}

export type LibraryAssetItem = BaseLibraryItem & {
  kind: "asset"
  name: string
  type: AssetType
}

export type LibraryLinkItem = BaseLibraryItem & {
  kind: "link"
  category: string
  url: string
  note: string
}

export type LibraryNoteItem = BaseLibraryItem & {
  kind: "note"
  preview: string
}

export type LibraryItem =
  | LibraryCopyItem
  | LibraryAssetItem
  | LibraryLinkItem
  | LibraryNoteItem

export type AccessReference = {
  id: string
  platform: string
  account: string
  loginUrl: string
  note: string
  storedIn: string
}

export const priorities: Priority[] = ["Alta", "Media", "Baja"]

export const projectStatuses: ProjectStatus[] = [
  "Activo",
  "En pausa",
  "Planificación",
  "Completado",
]

export const taskStatuses: TaskStatus[] = [
  "Pendiente",
  "En curso",
  "En revisión",
  "Bloqueado",
  "Terminado",
]

export const operativeTaskStatuses: TaskStatus[] = [
  "Pendiente",
  "En curso",
  "Terminado",
]

export const libraryItemTypes: LibraryItemType[] = ["note", "link", "resource", "email"]

export const contentAssetStatuses: ContentAssetStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
]

export const contentAssetVersionStatuses: ContentAssetVersionStatus[] = [
  "draft",
  "approved",
  "rejected",
  "published",
]

export const contentAssetTypes: ContentAssetType[] = [
  "product_copy",
  "campaign_post",
  "catalog_copy",
  "whatsapp_copy",
  "ad_creative",
  "web_copy",
]

export const contentAssetChannels: ContentAssetChannel[] = [
  "facebook",
  "instagram",
  "whatsapp",
  "web",
  "meta_ads",
  "email",
]

export const contentPostStatuses: ContentPostStatus[] = [
  "Idea",
  "Pendiente",
  "Diseñado",
  "Programado",
  "Publicado",
  "Cancelado",
]

export const contentBrands: ContentBrand[] = [
  "Rey del Abasto",
  "Sudamerican",
  "Inmobiliaria",
  "Medalleros",
  "Marca personal",
]

export const contentPlanningStatuses: ContentPlanningStatus[] = [
  "pendiente de producción",
  "en diseño",
  "copy listo",
  "listo para programar",
]

export const contentPublishingStatuses: ContentPublishingStatus[] = [
  "pendiente",
  "programado",
  "publicado",
]
