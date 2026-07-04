"use client"

import { CalendarDays, Hash, Plus, Radio } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentStatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppStore } from "@/lib/store"
import type { RdaContentItem, RdaContentStatus } from "@/lib/types"

const statuses: RdaContentStatus[] = [
  "Programado",
  "En revisión",
  "En pausa",
  "Listo",
]

function ContentCard({ item }: { item: RdaContentItem }) {
  const { updateRdaContentItem } = useAppStore()

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{item.product}</p>
          <ContentStatusBadge status={item.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Hash className="size-3" />
            {item.format}
          </span>
          <span className="flex items-center gap-1">
            <Radio className="size-3" />
            {item.channel}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {item.publishDate}
          </span>
        </div>
        <p className="rounded-md bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          {item.notes}
        </p>
        <Select
          value={item.status}
          onValueChange={(value) =>
            updateRdaContentItem(item.id, { status: value as RdaContentStatus })
          }
        >
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function Column({
  title,
  status,
  items,
}: {
  title: string
  status: RdaContentStatus
  items: RdaContentItem[]
}) {
  const filtered = items.filter((item) => item.status === status)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-xs tabular-nums text-muted-foreground">
          {filtered.length}
        </span>
      </div>
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => <ContentCard key={item.id} item={item} />)
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
            Sin ítems.
          </p>
        )}
      </div>
    </div>
  )
}

function NewContentForm() {
  const { addRdaContentItem } = useAppStore()
  const submit = (formData: FormData) => {
    const product = String(formData.get("product") ?? "").trim()
    if (!product) return
    addRdaContentItem({
      product,
      format: String(formData.get("format") ?? "Post").trim() || "Post",
      channel: String(formData.get("channel") ?? "Instagram").trim() || "Instagram",
      publishDate: String(formData.get("publishDate") ?? "Esta semana").trim() || "Esta semana",
      notes: String(formData.get("notes") ?? "Pendiente de definir").trim() || "Pendiente de definir",
      status: "Programado",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo contenido</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit(new FormData(event.currentTarget))
            event.currentTarget.reset()
          }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rda-product">Producto</Label>
            <Input id="rda-product" name="product" placeholder="Producto o promo" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rda-format">Formato</Label>
            <Input id="rda-format" name="format" placeholder="Reel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rda-channel">Canal</Label>
            <Input id="rda-channel" name="channel" placeholder="Instagram" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rda-date">Fecha</Label>
            <Input id="rda-date" name="publishDate" placeholder="Vie 10" />
          </div>
          <div className="flex items-end">
            <Button size="sm" className="gap-1">
              <Plus className="size-4" />
              Agregar
            </Button>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-5">
            <Label htmlFor="rda-notes">Notas</Label>
            <Input id="rda-notes" name="notes" placeholder="Brief rápido" />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ReyDelAbastoPage() {
  const { rdaContentItems } = useAppStore()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rey del Abasto"
        description="Centro de control de operaciones de contenido semanal."
      />
      <NewContentForm />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Column
          title="Publicaciones de esta semana"
          status="Programado"
          items={rdaContentItems}
        />
        <Column title="Cambios / revisión" status="En revisión" items={rdaContentItems} />
        <Column title="En pausa" status="En pausa" items={rdaContentItems} />
        <Column title="Listo para publicar" status="Listo" items={rdaContentItems} />
      </div>
    </div>
  )
}
