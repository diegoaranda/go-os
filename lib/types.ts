export type Priority = "Alta" | "Media" | "Baja"

export type ProjectStatus = "Activo" | "En pausa" | "Planificación" | "Completado"

export type TaskStatus =
  | "Pendiente"
  | "En curso"
  | "En revisión"
  | "Bloqueado"
  | "Terminado"

export type TaskSource = "Manual" | "ClickUp" | "Inbox"

export type LibraryItemType = "note" | "link" | "resource"

export type ContentPostStatus =
  | "Idea"
  | "Pendiente"
  | "Diseñado"
  | "Programado"
  | "Publicado"
  | "Cancelado"

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

export const libraryItemTypes: LibraryItemType[] = ["note", "link", "resource"]

export const contentPostStatuses: ContentPostStatus[] = [
  "Idea",
  "Pendiente",
  "Diseñado",
  "Programado",
  "Publicado",
  "Cancelado",
]
