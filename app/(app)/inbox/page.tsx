"use client"

import { Archive, ArrowRight, CheckCircle2, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuickCapture } from "@/components/quick-capture"
import { useAppStore } from "@/lib/store"

export default function InboxPage() {
  const {
    inboxItems,
    addInboxItem,
    archiveInboxItem,
    convertInboxItemToTask,
    deleteInboxItem,
    projectName,
  } = useAppStore()

  const items = inboxItems.filter((item) => !item.archived)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Captura todo aquí primero. Procesa después convirtiendo en tareas o archivando."
      />

      <Card>
        <CardContent className="pt-6">
          <QuickCapture onCapture={addInboxItem} />
        </CardContent>
      </Card>

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
                <p className="text-sm font-medium leading-snug">{item.content}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.createdAt}</span>
                  <span aria-hidden>·</span>
                  <Badge variant="outline" className="border-transparent bg-secondary font-normal">
                    Sugerido: {projectName(item.suggestedProject)}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => convertInboxItemToTask(item.id)}
                  className="h-8 gap-1"
                >
                  <CheckCircle2 className="size-3.5" />
                  Convertir
                  <ArrowRight className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => archiveInboxItem(item.id)}
                  className="h-8 gap-1 text-muted-foreground"
                >
                  <Archive className="size-3.5" />
                  <span className="sr-only sm:not-sr-only">Archivar</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteInboxItem(item.id)}
                  className="h-8 gap-1 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only sm:not-sr-only">Eliminar</span>
                </Button>
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
