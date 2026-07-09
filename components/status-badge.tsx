import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  Priority,
  TaskPriority,
  TaskStatus,
  ContentStatus,
  Project,
  CopyStatus,
  AssetType,
} from "@/lib/data"

const dot = "mr-1.5 size-1.5 rounded-full"

export function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    Pendiente: "text-muted-foreground bg-muted/60",
    "En curso": "text-primary bg-primary/10",
    "En revisión": "text-amber-400 bg-amber-400/10",
    Bloqueado: "text-destructive bg-destructive/10",
    Terminado: "text-foreground/70 bg-secondary",
  }
  const dotColor: Record<TaskStatus, string> = {
    Pendiente: "bg-muted-foreground",
    "En curso": "bg-primary",
    "En revisión": "bg-amber-400",
    Bloqueado: "bg-destructive",
    Terminado: "bg-foreground/50",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[status])}>
      <span className={cn(dot, dotColor[status])} />
      {status}
    </Badge>
  )
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const map: Record<ContentStatus, string> = {
    Programado: "text-primary bg-primary/10",
    "En revisión": "text-amber-400 bg-amber-400/10",
    "En pausa": "text-muted-foreground bg-muted/60",
    Listo: "text-primary bg-primary/15",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[status])}>
      {status}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: Priority | TaskPriority }) {
  const map: Record<Priority | TaskPriority, string> = {
    Urgente: "text-red-300 bg-red-500/15",
    Alta: "text-destructive bg-destructive/10",
    Media: "text-amber-400 bg-amber-400/10",
    Baja: "text-muted-foreground bg-muted/60",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[priority])}>
      {priority}
    </Badge>
  )
}

export function CopyStatusBadge({ status }: { status: CopyStatus }) {
  const map: Record<CopyStatus, string> = {
    Borrador: "text-muted-foreground bg-muted/60",
    Aprobado: "text-primary bg-primary/10",
    Publicado: "text-primary bg-primary/15",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[status])}>
      {status}
    </Badge>
  )
}

export function AssetTypeBadge({ type }: { type: AssetType }) {
  const map: Record<AssetType, string> = {
    Imagen: "text-primary bg-primary/10",
    PDF: "text-destructive bg-destructive/10",
    Mockup: "text-amber-400 bg-amber-400/10",
    Referencia: "text-sky-400 bg-sky-400/10",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[type])}>
      {type}
    </Badge>
  )
}

export function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  const map: Record<Project["status"], string> = {
    Activo: "text-primary bg-primary/10",
    "En pausa": "text-amber-400 bg-amber-400/10",
    "Planificación": "text-sky-400 bg-sky-400/10",
    Completado: "text-foreground/70 bg-secondary",
  }
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", map[status])}>
      {status}
    </Badge>
  )
}
