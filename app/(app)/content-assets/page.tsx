"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Plus, Search, Trash2, X } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createContentAsset,
  createContentAssetVersion,
  listContentAssets,
  listContentAssetVersions,
  type CreateContentAssetInput,
  type CreateContentAssetVersionInput,
} from "@/lib/supabase/data"
import {
  contentAssetChannels,
  contentAssetStatuses,
  contentAssetTypes,
  contentBrands,
  type ContentAsset,
  type ContentAssetStatus,
} from "@/lib/types"

const ALL = "all"

const assetTypeLabels: Record<string, string> = {
  product_copy: "Copy producto",
  campaign_post: "Post campaña",
  catalog_copy: "Copy catálogo",
  whatsapp_copy: "Copy WhatsApp",
  ad_creative: "Creativo ads",
  web_copy: "Copy web",
}

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  in_review: "En revisión",
  approved: "Aprobado",
  published: "Publicado",
  archived: "Archivado",
}

const channelLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  web: "Web",
  meta_ads: "Meta Ads",
  email: "Email",
}

type AssetFormState = CreateContentAssetInput

type InitialVersionDestination =
  | "facebook_post"
  | "instagram_post"
  | "whatsapp_channel"
  | "whatsapp_group"
  | "web_catalog"
  | "meta_ads"
  | "email"
  | "other"

type InitialVersionFormState = Pick<
  CreateContentAssetVersionInput,
  "title" | "bodyCopy" | "cta" | "designBrief" | "imageUrl"
> & {
  id: string
  destination: InitialVersionDestination | ""
}

const initialVersionDestinationLabels: Record<InitialVersionDestination, string> = {
  facebook_post: "Facebook post",
  instagram_post: "Instagram post",
  whatsapp_channel: "WhatsApp canal",
  whatsapp_group: "WhatsApp grupo",
  web_catalog: "Web catálogo",
  meta_ads: "Meta Ads",
  email: "Email",
  other: "Otro",
}

const initialVersionTitleByDestination: Record<InitialVersionDestination, string> = {
  facebook_post: "Facebook post",
  instagram_post: "Instagram post",
  whatsapp_channel: "Canal WhatsApp",
  whatsapp_group: "Grupo WhatsApp",
  web_catalog: "Web catálogo",
  meta_ads: "Meta Ads",
  email: "Email",
  other: "Otro",
}

function emptyAssetForm(): AssetFormState {
  return {
    brand: contentBrands[0],
    title: "",
    slug: "",
    assetType: contentAssetTypes[0],
    status: "draft",
    channel: "",
    productName: "",
    campaignName: "",
    contentPillar: "",
    objective: "",
    coverImageUrl: "",
    notes: "",
  }
}

function emptyInitialVersion(): InitialVersionFormState {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    destination: "",
    title: "",
    bodyCopy: "",
    cta: "",
    designBrief: "",
    imageUrl: "",
  }
}

function formatDateTime(value: string) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function statusClass(status: string) {
  if (status === "approved" || status === "published") {
    return "border-transparent bg-primary text-primary-foreground"
  }
  if (status === "in_review") return "border-transparent bg-secondary text-foreground"
  if (status === "archived") return "text-muted-foreground"
  return "border-border text-muted-foreground"
}

export default function ContentAssetsPage() {
  const [assets, setAssets] = useState<ContentAsset[]>([])
  const [currentVersionTitles, setCurrentVersionTitles] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AssetFormState>(() => emptyAssetForm())
  const [initialVersions, setInitialVersions] = useState<InitialVersionFormState[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [brandFilter, setBrandFilter] = useState(ALL)
  const [typeFilter, setTypeFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [channelFilter, setChannelFilter] = useState(ALL)

  useEffect(() => {
    let cancelled = false

    async function loadAssets() {
      try {
        const nextAssets = await listContentAssets()
        const titleEntries = await Promise.all(
          nextAssets
            .filter((asset) => asset.currentVersionId)
            .map(async (asset) => {
              const versions = await listContentAssetVersions(asset.id)
              const currentVersion = versions.find((version) => version.id === asset.currentVersionId)
              return currentVersion ? ([asset.id, currentVersion.title] as const) : null
            }),
        )
        if (!cancelled) {
          setAssets(nextAssets)
          setCurrentVersionTitles(
            Object.fromEntries(
              titleEntries.filter(
                (entry): entry is readonly [string, string] => entry !== null,
              ),
            ),
          )
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudieron cargar los assets.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadAssets()

    return () => {
      cancelled = true
    }
  }, [])

  const filterOptions = useMemo(() => {
    return {
      brands: Array.from(new Set([...contentBrands, ...assets.map((asset) => asset.brand)].filter(Boolean))),
      channels: Array.from(
        new Set([...contentAssetChannels, ...assets.map((asset) => asset.channel)].filter(Boolean)),
      ),
    }
  }, [assets])

  const filteredAssets = useMemo(() => {
    const query = normalize(searchQuery)

    return assets.filter((asset) => {
      const matchesFilters =
        (brandFilter === ALL || asset.brand === brandFilter) &&
        (typeFilter === ALL || asset.assetType === typeFilter) &&
        (statusFilter === ALL || asset.status === statusFilter) &&
        (channelFilter === ALL || asset.channel === channelFilter)

      if (!matchesFilters) return false
      if (!query) return true

      return [
        asset.title,
        asset.brand,
        asset.assetType,
        asset.productName,
        asset.channel,
        asset.status,
        asset.campaignName,
      ]
        .map(normalize)
        .join(" ")
        .includes(query)
    })
  }, [assets, brandFilter, channelFilter, searchQuery, statusFilter, typeFilter])

  const createAsset = async () => {
    const title = form.title.trim()
    if (!title) return

    const versionsToCreate = initialVersions
      .map((version) => ({
        title: version.title.trim(),
        bodyCopy: version.bodyCopy.trim(),
        cta: version.cta.trim(),
        designBrief: version.designBrief.trim(),
        imageUrl: version.imageUrl.trim(),
      }))
      .filter((version) => version.title || version.bodyCopy)

    setIsSaving(true)
    setError("")
    try {
      const created = await createContentAsset({
        ...form,
        title,
        brand: form.brand.trim(),
        slug: form.slug.trim(),
        channel: form.channel.trim(),
        productName: form.productName.trim(),
        campaignName: form.campaignName.trim(),
        contentPillar: form.contentPillar.trim(),
        objective: form.objective.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        notes: form.notes.trim(),
      })
      let firstVersionTitle = ""
      let firstVersionId = ""

      for (const version of versionsToCreate) {
        const createdVersion = await createContentAssetVersion(created.id, {
          title: version.title,
          hook: "",
          bodyCopy: version.bodyCopy,
          caption: "",
          cta: version.cta,
          hashtags: "",
          offerText: "",
          designBrief: version.designBrief,
          imageUrl: version.imageUrl,
          imageAltUrls: [],
          status: "draft",
          changeSummary: "Versión inicial",
          createdBy: "",
        })

        if (!firstVersionId) {
          firstVersionId = createdVersion.id
          firstVersionTitle = createdVersion.title
        }
      }

      const assetForList = firstVersionId
        ? { ...created, currentVersionId: firstVersionId }
        : created

      setAssets((current) => [assetForList, ...current])
      if (firstVersionTitle) {
        setCurrentVersionTitles((current) => ({ ...current, [created.id]: firstVersionTitle }))
      }
      setForm(emptyAssetForm())
      setInitialVersions([])
      setShowForm(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el asset.")
    } finally {
      setIsSaving(false)
    }
  }

  const addInitialVersion = () => {
    setInitialVersions((current) => [...current, emptyInitialVersion()])
  }

  const updateInitialVersion = (
    versionId: string,
    updates: Partial<InitialVersionFormState>,
  ) => {
    setInitialVersions((current) =>
      current.map((version) => (version.id === versionId ? { ...version, ...updates } : version)),
    )
  }

  const selectInitialVersionDestination = (
    version: InitialVersionFormState,
    value: string | null,
  ) => {
    if (!value) return

    const destination = value as InitialVersionDestination
    updateInitialVersion(version.id, {
      destination,
      title: version.title.trim()
        ? version.title
        : initialVersionTitleByDestination[destination],
    })
  }

  const removeInitialVersion = (versionId: string) => {
    setInitialVersions((current) => current.filter((version) => version.id !== versionId))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Content Assets"
        description="Copies, versiones y archivos por marca, producto y pieza."
        action={
          <Button size="sm" onClick={() => setShowForm((current) => !current)}>
            {showForm ? <X data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            {showForm ? "Cerrar" : "Nuevo asset"}
          </Button>
        }
      />

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crear asset</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Marca</Label>
              <Input
                value={form.brand}
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Pieza o copy a trabajar"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.assetType}
                onValueChange={(value) => setForm((current) => ({ ...current, assetType: value ?? current.assetType }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contentAssetTypes.map((type) => (
                    <SelectItem key={type} value={type}>{assetTypeLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, status: value as ContentAssetStatus }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contentAssetStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Canal</Label>
              <Input
                value={form.channel}
                onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}
                placeholder="instagram, web, email..."
              />
            </div>
            <Input value={form.productName} onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))} placeholder="Producto" />
            <Input value={form.campaignName} onChange={(event) => setForm((current) => ({ ...current, campaignName: event.target.value }))} placeholder="Campaña" />
            <Input value={form.contentPillar} onChange={(event) => setForm((current) => ({ ...current, contentPillar: event.target.value }))} placeholder="Pilar de contenido" />
            <Input className="md:col-span-3" value={form.objective} onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))} placeholder="Objetivo" />
            <Input className="md:col-span-3" value={form.coverImageUrl} onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))} placeholder="Cover image URL opcional" />
            <Textarea className="md:col-span-3" rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" />

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 md:col-span-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Versiones iniciales</h3>
                  <p className="text-xs text-muted-foreground">
                    Agrega solo los copies que necesitas para este asset.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addInitialVersion}>
                  <Plus data-icon="inline-start" />
                  Agregar versión
                </Button>
              </div>

              {initialVersions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Puedes crear el asset sin versiones iniciales y agregarlas después desde el detalle.
                </p>
              ) : null}

              {initialVersions.map((version, index) => (
                <div
                  key={version.id}
                  className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-2"
                >
                  <div className="flex items-center justify-between gap-3 md:col-span-2">
                    <p className="text-sm font-medium">Versión {index + 1}</p>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Eliminar versión"
                      aria-label="Eliminar versión inicial"
                      onClick={() => removeInitialVersion(version.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Canal/destino</Label>
                    <Select
                      value={version.destination}
                      onValueChange={(value) => selectInitialVersionDestination(version, value)}
                    >
                      <SelectTrigger><SelectValue placeholder="Elegir destino" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(initialVersionDestinationLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Título</Label>
                    <Input
                      value={version.title}
                      onChange={(event) => updateInitialVersion(version.id, { title: event.target.value })}
                      placeholder="Facebook post, Canal WhatsApp..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label>Copy</Label>
                    <Textarea
                      rows={6}
                      value={version.bodyCopy}
                      onChange={(event) => updateInitialVersion(version.id, { bodyCopy: event.target.value })}
                      placeholder="Escribe el copy de esta versión"
                    />
                  </div>
                  <Input
                    value={version.cta}
                    onChange={(event) => updateInitialVersion(version.id, { cta: event.target.value })}
                    placeholder="CTA opcional"
                  />
                  <Input
                    value={version.imageUrl}
                    onChange={(event) => updateInitialVersion(version.id, { imageUrl: event.target.value })}
                    placeholder="Image URL opcional"
                  />
                  <Textarea
                    className="md:col-span-2"
                    rows={3}
                    value={version.designBrief}
                    onChange={(event) => updateInitialVersion(version.id, { designBrief: event.target.value })}
                    placeholder="Design brief opcional"
                  />
                </div>
              ))}
            </div>

            <Button className="md:col-span-3" disabled={isSaving || !form.title.trim()} onClick={createAsset}>
              <Plus data-icon="inline-start" />
              {isSaving ? "Creando..." : "Crear asset"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_repeat(4,150px)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por título, producto, marca o campaña"
              className="pl-8"
            />
          </div>
          <Select value={brandFilter} onValueChange={(value) => setBrandFilter(value ?? ALL)}>
            <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {filterOptions.brands.map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? ALL)}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {contentAssetTypes.map((type) => (
                <SelectItem key={type} value={type}>{assetTypeLabels[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? ALL)}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {contentAssetStatuses.map((status) => (
                <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value ?? ALL)}>
            <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {filterOptions.channels.map((channel) => (
                <SelectItem key={channel} value={channel}>{channelLabels[channel] ?? channel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando Content Assets...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && filteredAssets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay assets de contenido todavía
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="grid gap-3 border-b border-border p-4 last:border-b-0 lg:grid-cols-[minmax(0,1.2fr)_repeat(6,minmax(90px,0.7fr))_auto] lg:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{asset.title}</p>
              <p className="truncate text-xs text-muted-foreground">{asset.campaignName || asset.objective || "Sin campaña"}</p>
            </div>
            <Badge variant="outline" className="w-fit">{asset.brand}</Badge>
            <span className="text-xs text-muted-foreground">{assetTypeLabels[asset.assetType] ?? asset.assetType}</span>
            <span className="text-xs text-muted-foreground">{asset.productName || "Sin producto"}</span>
            <span className="text-xs text-muted-foreground">{asset.channel ? channelLabels[asset.channel] ?? asset.channel : "Sin canal"}</span>
            <Badge variant="outline" className={`w-fit ${statusClass(asset.status)}`}>{statusLabels[asset.status]}</Badge>
            <span className="text-xs text-muted-foreground">
              {asset.currentVersionId
                ? `Actual: ${currentVersionTitles[asset.id] || "Versión actual"}`
                : "Sin versión"}
            </span>
            <span className="text-xs text-muted-foreground">{formatDateTime(asset.updatedAt)}</span>
            <Link
              href={`/content-assets/${asset.id}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <ExternalLink data-icon="inline-start" />
              Abrir
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
