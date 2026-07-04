"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, ArrowRight, CheckCircle2, Pencil, Trash2, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { QuickCapture } from "@/components/quick-capture"
import {
  createInboxItem,
  createTask,
  deleteInboxItem,
  listInboxItems,
  listProjects,
  updateInboxItem,
} from "@/lib/supabase/data"
import type { InboxItem, Project } from "@/lib/types"

export default function InboxPage() {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [nextProjects, nextInboxItems] = await Promise.all([
          listProjects(),
          listInboxItems(),
        ])
        if (cancelled) return
        setProjects(nextProjects)
        setInboxItems(nextInboxItems)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar el inbox.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const projectName = useCallback(
    (id: string) => projects.find((project) => project.id === id)?.name ?? "Sin proyecto",
    [projects],
  )

  const captureInboxItem = async (content: string) => {
    setError("")
    try {
      const item = await createInboxItem({
        content,
        suggestedProject: projects[0]?.id,
      })
      setInboxItems((current) => [item, ...current])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo capturar el item.")
    }
  }

  const startEditing = (item: InboxItem) => {
    setEditing(item.id)
    setEditContent(item.content)
  }

  const saveInboxItem = async (id: string) => {
    const content = editContent.trim()
    if (!content) return
    setError("")
    try {
      const item = await updateInboxItem(id, { content })
      setInboxItems((current) =>
        current.map((currentItem) => (currentItem.id === id ? item : currentItem)),
      )
      setEditing(null)
      setEditContent("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo editar el item.")
    }
  }

  const archiveInboxItem = async (id: string) => {
    setError("")
    try {
      const item = await updateInboxItem(id, { archived: true })
      setInboxItems((current) =>
        current.map((currentItem) => (currentItem.id === id ? item : currentItem)),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo archivar el item.")
    }
  }

  const removeInboxItem = async (id: string) => {
    setError("")
    try {
      await deleteInboxItem(id)
      setInboxItems((current) => current.filter((item) => item.id !== id))
      if (editing === id) setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el item.")
    }
  }

  const convertInboxItemToTask = async (item: InboxItem) => {
    const projectId = item.suggestedProject || projects[0]?.id
    if (!projectId) {
      setError("Crea un proyecto antes de convertir este item en tarea.")
      return
    }

    setError("")
    try {
      await createTask({
        title: item.content,
        status: "Pendiente",
        priority: "Media",
        projectId,
        due: "Hoy",
        source: "Inbox",
      })
      await deleteInboxItem(item.id)
      setInboxItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo convertir el item.")
    }
  }

  const items = inboxItems.filter((item) => !item.archived)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Captura todo aquí primero. Procesa después convirtiendo en tareas o archivando."
      />

      <Card>
        <CardContent className="pt-6">
          <QuickCapture
            onCapture={(content) => {
              void captureInboxItem(content)
            }}
          />
          {projects.length === 0 && !isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Crea un proyecto para sugerirlo al convertir items en tareas.
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando inbox...
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Por procesar</h2>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>

        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-opacity sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1.5">
                {editing === item.id ? (
                  <Input
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                        event.preventDefault()
                        void saveInboxItem(item.id)
                      }
                    }}
                    aria-label="Editar item de inbox"
                  />
                ) : (
                  <p className="text-sm font-medium leading-snug">{item.content}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.createdAt}</span>
                  <span aria-hidden>·</span>
                  <Badge variant="outline" className="border-transparent bg-secondary font-normal">
                    Sugerido: {projectName(item.suggestedProject)}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {editing === item.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        void saveInboxItem(item.id)
                      }}
                      className="h-8 gap-1"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(null)
                        setEditContent("")
                      }}
                      className="h-8 gap-1 text-muted-foreground"
                    >
                      <X className="size-3.5" />
                      <span className="sr-only sm:not-sr-only">Cancelar</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        void convertInboxItemToTask(item)
                      }}
                      className="h-8 gap-1"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Convertir
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(item)}
                      className="h-8 gap-1 text-muted-foreground"
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void archiveInboxItem(item.id)
                      }}
                      className="h-8 gap-1 text-muted-foreground"
                    >
                      <Archive className="size-3.5" />
                      <span className="sr-only sm:not-sr-only">Archivar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void removeInboxItem(item.id)
                      }}
                      className="h-8 gap-1 text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only sm:not-sr-only">Eliminar</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Inbox vacío. Todo procesado.
          </p>
        )}
      </div>
    </div>
  )
}
