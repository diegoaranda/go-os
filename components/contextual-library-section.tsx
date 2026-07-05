"use client"

import { useState } from "react"
import { ExternalLink, LinkIcon, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  libraryItemTypes,
  type KnowledgeLibraryItem,
  type LibraryItemType,
} from "@/lib/types"

const typeLabels: Record<LibraryItemType, string> = {
  note: "Nota",
  link: "Link",
  resource: "Recurso",
}

type ContextualLibraryInput = Omit<KnowledgeLibraryItem, "id" | "createdAt">

export function ContextualLibrarySection({
  items,
  defaultAreaId = "",
  defaultProjectId = "",
  onCreate,
  onDelete,
}: {
  items: KnowledgeLibraryItem[]
  defaultAreaId?: string
  defaultProjectId?: string
  onCreate: (input: ContextualLibraryInput) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<LibraryItemType>("note")
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    setIsSubmitting(true)

    try {
      await onCreate({
        title: trimmedTitle,
        type,
        content: content.trim(),
        url: url.trim(),
        areaId: defaultAreaId,
        projectId: defaultProjectId,
      })
      setTitle("")
      setType("note")
      setUrl("")
      setContent("")
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">Recursos</h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-md bg-secondary/40 p-2">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium">{item.title}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant="outline" className="border-transparent bg-background font-normal">
                    {typeLabels[item.type]}
                  </Badge>
                  {onDelete ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        void onDelete(item.id)
                      }}
                      className="size-6 text-destructive"
                      aria-label={`Eliminar ${item.title}`}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  ) : null}
                </div>
              </div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline"
                >
                  <LinkIcon className="size-3 shrink-0" />
                  <span className="truncate">{item.url}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : null}
              {item.content ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.content}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            No hay recursos todavía.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_130px]">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nuevo recurso"
          />
          <Select
            value={type}
            onValueChange={(value) => setType(value as LibraryItemType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {libraryItemTypes.map((itemType) => (
                <SelectItem key={itemType} value={itemType}>
                  {typeLabels[itemType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="URL opcional"
        />
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Contenido opcional"
          rows={2}
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={isSubmitting || !title.trim()}
          className="w-fit gap-1"
        >
          <Plus className="size-4" />
          {isSubmitting ? "Guardando..." : "Agregar recurso"}
        </Button>
      </div>
    </div>
  )
}
