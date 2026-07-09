"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FilePlus,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  createContentAssetFile,
  createContentAssetVersion,
  deleteContentAsset,
  deleteContentAssetFile,
  getContentAsset,
  listContentAssetFiles,
  listContentAssetVersions,
  setContentAssetCurrentVersion,
  updateContentAsset,
  updateContentAssetVersion,
  type CreateContentAssetFileInput,
  type CreateContentAssetVersionInput,
  type UpdateContentAssetInput,
  type UpdateContentAssetVersionInput,
} from "@/lib/supabase/data"
import {
  contentAssetStatuses,
  contentAssetTypes,
  contentAssetVersionStatuses,
  type ContentAsset,
  type ContentAssetFile,
  type ContentAssetStatus,
  type ContentAssetVersion,
  type ContentAssetVersionStatus,
} from "@/lib/types"

const NONE = "none"

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

const versionStatusLabels: Record<string, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  rejected: "Rechazada",
  published: "Publicada",
}

type VersionFormState = CreateContentAssetVersionInput & {
  imageAltUrlsText: string
}

type VersionEditState = Pick<
  UpdateContentAssetVersionInput,
  "title" | "bodyCopy" | "cta" | "designBrief" | "imageUrl" | "status" | "changeSummary"
>

function emptyVersionForm(): VersionFormState {
  return {
    title: "",
    hook: "",
    bodyCopy: "",
    caption: "",
    cta: "",
    hashtags: "",
    offerText: "",
    designBrief: "",
    imageUrl: "",
    imageAltUrls: [],
    imageAltUrlsText: "",
    status: "draft",
    changeSummary: "",
    createdBy: "",
  }
}

function emptyFileForm(): CreateContentAssetFileInput {
  return {
    versionId: "",
    fileType: "",
    fileUrl: "",
    fileName: "",
    mimeType: "",
    sizeBytes: null,
    isPrimary: false,
  }
}

function buildVersionEdit(version: ContentAssetVersion): VersionEditState {
  return {
    title: version.title,
    bodyCopy: version.bodyCopy,
    cta: version.cta,
    designBrief: version.designBrief,
    imageUrl: version.imageUrl,
    status: version.status,
    changeSummary: version.changeSummary,
  }
}

function buildVersionEdits(versions: ContentAssetVersion[]) {
  return Object.fromEntries(
    versions.map((version) => [version.id, buildVersionEdit(version)]),
  )
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

function statusClass(status: string) {
  if (status === "approved" || status === "published") {
    return "border-transparent bg-primary text-primary-foreground"
  }
  if (status === "in_review") return "border-transparent bg-secondary text-foreground"
  if (status === "rejected" || status === "archived") return "text-muted-foreground"
  return "border-border text-muted-foreground"
}

function parseAltUrls(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildAssetEdit(asset: ContentAsset): UpdateContentAssetInput {
  return {
    brand: asset.brand,
    title: asset.title,
    slug: asset.slug,
    assetType: asset.assetType,
    status: asset.status,
    channel: asset.channel,
    productName: asset.productName,
    campaignName: asset.campaignName,
    contentPillar: asset.contentPillar,
    objective: asset.objective,
    coverImageUrl: asset.coverImageUrl,
    notes: asset.notes,
  }
}

function mergeAssetEdit(
  current: UpdateContentAssetInput | null,
  next: UpdateContentAssetInput,
) {
  return { ...(current ?? {}), ...next }
}

export default function ContentAssetDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const assetId = Array.isArray(params.id) ? params.id[0] : params.id
  const [asset, setAsset] = useState<ContentAsset | null>(null)
  const [versions, setVersions] = useState<ContentAssetVersion[]>([])
  const [versionEdits, setVersionEdits] = useState<Record<string, VersionEditState>>({})
  const [files, setFiles] = useState<ContentAssetFile[]>([])
  const [assetEdit, setAssetEdit] = useState<UpdateContentAssetInput | null>(null)
  const [versionForm, setVersionForm] = useState<VersionFormState>(() => emptyVersionForm())
  const [fileForm, setFileForm] = useState<CreateContentAssetFileInput>(() => emptyFileForm())
  const [activeTab, setActiveTab] = useState("copies")
  const [showVersionForm, setShowVersionForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadAsset() {
      try {
        const [nextAsset, nextVersions, nextFiles] = await Promise.all([
          getContentAsset(assetId),
          listContentAssetVersions(assetId),
          listContentAssetFiles(assetId),
        ])

        if (!cancelled) {
          setAsset(nextAsset)
          setAssetEdit(nextAsset ? buildAssetEdit(nextAsset) : null)
          setVersions(nextVersions)
          setVersionEdits(buildVersionEdits(nextVersions))
          setFiles(nextFiles)
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudo cargar el asset.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadAsset()

    return () => {
      cancelled = true
    }
  }, [assetId])

  const sortedVersions = useMemo(() => {
    return versions.toSorted((first, second) => first.versionNumber - second.versionNumber)
  }, [versions])

  const saveAsset = async () => {
    if (!asset || !assetEdit) return

    setIsSaving(true)
    setError("")
    try {
      const updated = await updateContentAsset(asset.id, {
        ...assetEdit,
        brand: assetEdit.brand?.trim(),
        title: assetEdit.title?.trim(),
        slug: assetEdit.slug?.trim(),
        channel: assetEdit.channel?.trim(),
        productName: assetEdit.productName?.trim(),
        campaignName: assetEdit.campaignName?.trim(),
        contentPillar: assetEdit.contentPillar?.trim(),
        objective: assetEdit.objective?.trim(),
        coverImageUrl: assetEdit.coverImageUrl?.trim(),
        notes: assetEdit.notes?.trim(),
      })
      setAsset(updated)
      setAssetEdit(buildAssetEdit(updated))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron guardar los cambios.")
    } finally {
      setIsSaving(false)
    }
  }

  const createVersion = async () => {
    if (!asset) return

    setIsSaving(true)
    setError("")
    try {
      const created = await createContentAssetVersion(asset.id, {
        ...versionForm,
        title: versionForm.title.trim(),
        hook: versionForm.hook.trim(),
        bodyCopy: versionForm.bodyCopy.trim(),
        caption: versionForm.caption.trim(),
        cta: versionForm.cta.trim(),
        hashtags: versionForm.hashtags.trim(),
        offerText: versionForm.offerText.trim(),
        designBrief: versionForm.designBrief.trim(),
        imageUrl: versionForm.imageUrl.trim(),
        imageAltUrls: parseAltUrls(versionForm.imageAltUrlsText),
        changeSummary: versionForm.changeSummary.trim(),
        createdBy: versionForm.createdBy.trim(),
      })
      setVersions((current) => [created, ...current])
      setVersionEdits((current) => ({ ...current, [created.id]: buildVersionEdit(created) }))
      if (!asset.currentVersionId) {
        setAsset((current) => (current ? { ...current, currentVersionId: created.id } : current))
      }
      setVersionForm(emptyVersionForm())
      setShowVersionForm(false)
      setActiveTab("copies")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la versión.")
    } finally {
      setIsSaving(false)
    }
  }

  const markCurrentVersion = async (versionId: string) => {
    if (!asset) return

    setIsSaving(true)
    setError("")
    try {
      const updated = await setContentAssetCurrentVersion(asset.id, versionId)
      setAsset(updated)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo marcar la versión actual.")
    } finally {
      setIsSaving(false)
    }
  }

  const updateVersionEdit = (
    versionId: string,
    updates: Partial<VersionEditState>,
  ) => {
    setVersionEdits((current) => ({
      ...current,
      [versionId]: {
        ...(current[versionId] ?? {}),
        ...updates,
      },
    }))
  }

  const saveVersion = async (version: ContentAssetVersion) => {
    const edit = versionEdits[version.id]
    if (!edit) return

    setIsSaving(true)
    setError("")
    try {
      const updated = await updateContentAssetVersion(version.id, {
        title: edit.title?.trim(),
        bodyCopy: edit.bodyCopy?.trim(),
        cta: edit.cta?.trim(),
        designBrief: edit.designBrief?.trim(),
        imageUrl: edit.imageUrl?.trim(),
        status: edit.status,
        changeSummary: edit.changeSummary?.trim() || "Edición inline",
      })
      setVersions((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setVersionEdits((current) => ({ ...current, [updated.id]: buildVersionEdit(updated) }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el copy.")
    } finally {
      setIsSaving(false)
    }
  }

  const createFile = async () => {
    if (!asset || !fileForm.fileUrl.trim()) return

    setIsSaving(true)
    setError("")
    try {
      const created = await createContentAssetFile(asset.id, {
        ...fileForm,
        versionId: fileForm.versionId === NONE ? "" : fileForm.versionId,
        fileType: fileForm.fileType.trim() || "archivo",
        fileUrl: fileForm.fileUrl.trim(),
        fileName: fileForm.fileName.trim() || fileForm.fileUrl.trim(),
        mimeType: fileForm.mimeType.trim(),
      })
      setFiles((current) => [created, ...current])
      setFileForm(emptyFileForm())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el archivo.")
    } finally {
      setIsSaving(false)
    }
  }

  const removeFile = async (fileId: string) => {
    setIsSaving(true)
    setError("")
    try {
      await deleteContentAssetFile(fileId)
      setFiles((current) => current.filter((file) => file.id !== fileId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el archivo.")
    } finally {
      setIsSaving(false)
    }
  }

  const removeAsset = async () => {
    if (!asset || !window.confirm("¿Eliminar este Content Asset y sus versiones?")) return

    setIsSaving(true)
    setError("")
    try {
      await deleteContentAsset(asset.id)
      router.push("/content-assets")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el asset.")
      setIsSaving(false)
    }
  }

  const copyText = async (value: string) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando Content Asset...</p>
  }

  if (!asset) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/content-assets" className={buttonVariants({ size: "sm", variant: "outline" })}>
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Link>
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No se encontró este Content Asset.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={asset.title}
        description={`${asset.brand} · ${assetTypeLabels[asset.assetType] ?? asset.assetType}`}
        action={
          <Link href="/content-assets" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <ArrowLeft data-icon="inline-start" />
            Volver
          </Link>
        }
      />

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Ficha del asset</CardTitle>
          <CardAction className="flex gap-2">
            <Button size="sm" variant="outline" disabled={isSaving || !assetEdit?.title} onClick={saveAsset}>
              <Save data-icon="inline-start" />
              Guardar
            </Button>
            <Button size="icon-sm" variant="destructive" disabled={isSaving} title="Eliminar asset" onClick={removeAsset}>
              <Trash2 />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Título</Label>
            <Input value={assetEdit?.title ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { title: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Marca</Label>
            <Input value={assetEdit?.brand ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { brand: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={assetEdit?.assetType ?? contentAssetTypes[0]} onValueChange={(value) => setAssetEdit((current) => mergeAssetEdit(current, { assetType: value ?? asset.assetType }))}>
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
            <Select value={assetEdit?.status ?? asset.status} onValueChange={(value) => setAssetEdit((current) => mergeAssetEdit(current, { status: value as ContentAssetStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {contentAssetStatuses.map((status) => (
                  <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input value={assetEdit?.channel ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { channel: event.target.value }))} placeholder="Canal" />
          <Input value={assetEdit?.productName ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { productName: event.target.value }))} placeholder="Producto" />
          <Input value={assetEdit?.campaignName ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { campaignName: event.target.value }))} placeholder="Campaña" />
          <Input value={assetEdit?.contentPillar ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { contentPillar: event.target.value }))} placeholder="Pilar" />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value ?? "copies")}>
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="copies">Copies</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="files">Archivos</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="copies" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusClass(asset.status)}>{statusLabels[asset.status]}</Badge>
              <span className="text-xs text-muted-foreground">
                {versions.length} {versions.length === 1 ? "copy" : "copies"} en este asset
              </span>
            </div>
            <Button size="sm" onClick={() => setShowVersionForm((current) => !current)}>
              <Plus data-icon="inline-start" />
              {showVersionForm ? "Cerrar" : "Nueva versión"}
            </Button>
          </div>

          {sortedVersions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Este asset todavía no tiene versiones.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {sortedVersions.map((version) => {
                const edit = versionEdits[version.id] ?? buildVersionEdit(version)
                const isCurrent = version.id === asset.currentVersionId

                return (
                  <Card key={version.id} size="sm">
                    <CardHeader className="gap-2">
                      <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          v{version.versionNumber}
                        </span>
                        {isCurrent ? (
                          <span className="text-xs font-medium text-primary">Actual</span>
                        ) : null}
                      </CardTitle>
                      <CardAction className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          title="Copiar copy"
                          aria-label="Copiar copy"
                          onClick={() => copyText(edit.bodyCopy || version.bodyCopy)}
                        >
                          <Copy />
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Título</Label>
                        <Input
                          value={edit.title ?? ""}
                          onChange={(event) => updateVersionEdit(version.id, { title: event.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Body copy</Label>
                        <Textarea
                          rows={5}
                          value={edit.bodyCopy ?? ""}
                          onChange={(event) => updateVersionEdit(version.id, { bodyCopy: event.target.value })}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" disabled={isSaving} onClick={() => saveVersion(version)}>
                          <Save data-icon="inline-start" />
                          Guardar
                        </Button>
                        {!isCurrent ? (
                          <Button size="sm" variant="outline" disabled={isSaving} onClick={() => markCurrentVersion(version.id)}>
                            <Star data-icon="inline-start" />
                            Marcar actual
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {showVersionForm ? (
            <VersionForm
              form={versionForm}
              isSaving={isSaving}
              setForm={setVersionForm}
              onCreate={createVersion}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="flex flex-col gap-3">
          {versions.map((version) => (
            <Card key={version.id} size="sm">
              <CardContent className="grid gap-3 py-1 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{version.versionNumber}</Badge>
                  {version.id === asset.currentVersionId ? (
                    <span className="text-xs font-medium text-primary">Actual</span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{version.title || asset.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{version.changeSummary || formatDateTime(version.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="files" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-3">
            {files.map((file) => (
              <Card key={file.id} size="sm">
                <CardContent className="grid gap-3 py-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.fileName}</p>
                    <p className="truncate text-xs text-muted-foreground">{file.fileType} · {formatDateTime(file.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <a className={buttonVariants({ size: "icon-sm", variant: "outline" })} href={file.fileUrl} target="_blank" rel="noreferrer" title="Abrir archivo">
                      <ExternalLink />
                    </a>
                    <Button size="icon-sm" variant="destructive" disabled={isSaving} title="Eliminar archivo" onClick={() => removeFile(file.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agregar archivo por URL</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input value={fileForm.fileName} onChange={(event) => setFileForm((current) => ({ ...current, fileName: event.target.value }))} placeholder="Nombre visible" />
              <Input value={fileForm.fileType} onChange={(event) => setFileForm((current) => ({ ...current, fileType: event.target.value }))} placeholder="Tipo: imagen, pdf, editable..." />
              <Input value={fileForm.fileUrl} onChange={(event) => setFileForm((current) => ({ ...current, fileUrl: event.target.value }))} placeholder="URL del archivo" />
              <Input value={fileForm.mimeType} onChange={(event) => setFileForm((current) => ({ ...current, mimeType: event.target.value }))} placeholder="MIME opcional" />
              <Select value={fileForm.versionId || NONE} onValueChange={(value) => setFileForm((current) => ({ ...current, versionId: value && value !== NONE ? value : "" }))}>
                <SelectTrigger><SelectValue placeholder="Versión vinculada" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin versión</SelectItem>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>v{version.versionNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center justify-between gap-3 text-sm">
                Archivo principal
                <Switch checked={fileForm.isPrimary} onCheckedChange={(checked) => setFileForm((current) => ({ ...current, isPrimary: checked }))} />
              </label>
              <Button disabled={isSaving || !fileForm.fileUrl.trim()} onClick={createFile}>
                <FilePlus data-icon="inline-start" />
                Guardar archivo
              </Button>
              <p className="text-xs text-muted-foreground">Fase 1 usa URLs manuales. El upload directo puede conectarse al bucket después.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="flex flex-col gap-3">
          <Card>
            <CardContent className="flex flex-col gap-3 py-1">
              <Textarea rows={8} value={assetEdit?.notes ?? ""} onChange={(event) => setAssetEdit((current) => mergeAssetEdit(current, { notes: event.target.value }))} placeholder="Notas internas, criterio editorial, pendientes..." />
              <Button className="self-start" disabled={isSaving} onClick={saveAsset}>
                <Save data-icon="inline-start" />
                Guardar notas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VersionForm({
  form,
  isSaving,
  setForm,
  onCreate,
}: {
  form: VersionFormState
  isSaving: boolean
  setForm: Dispatch<SetStateAction<VersionFormState>>
  onCreate: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva versión</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Título de versión" />
        <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as ContentAssetVersionStatus }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {contentAssetVersionStatuses.map((status) => (
              <SelectItem key={status} value={status}>{versionStatusLabels[status]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={form.hook} onChange={(event) => setForm((current) => ({ ...current, hook: event.target.value }))} placeholder="Hook" />
        <Input value={form.cta} onChange={(event) => setForm((current) => ({ ...current, cta: event.target.value }))} placeholder="CTA" />
        <Textarea className="md:col-span-2" rows={4} value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} placeholder="Caption" />
        <Textarea className="md:col-span-2" rows={4} value={form.bodyCopy} onChange={(event) => setForm((current) => ({ ...current, bodyCopy: event.target.value }))} placeholder="Body copy" />
        <Input value={form.offerText} onChange={(event) => setForm((current) => ({ ...current, offerText: event.target.value }))} placeholder="Oferta" />
        <Input value={form.hashtags} onChange={(event) => setForm((current) => ({ ...current, hashtags: event.target.value }))} placeholder="Hashtags" />
        <Textarea className="md:col-span-2" rows={3} value={form.designBrief} onChange={(event) => setForm((current) => ({ ...current, designBrief: event.target.value }))} placeholder="Brief para diseño" />
        <Input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Imagen principal URL" />
        <Input value={form.createdBy} onChange={(event) => setForm((current) => ({ ...current, createdBy: event.target.value }))} placeholder="Creado por" />
        <Textarea className="md:col-span-2" rows={2} value={form.imageAltUrlsText} onChange={(event) => setForm((current) => ({ ...current, imageAltUrlsText: event.target.value }))} placeholder="URLs alternativas separadas por coma o salto de línea" />
        <Input className="md:col-span-2" value={form.changeSummary} onChange={(event) => setForm((current) => ({ ...current, changeSummary: event.target.value }))} placeholder="Resumen de cambios" />
        <Button className="md:col-span-2" disabled={isSaving} onClick={onCreate}>
          <Plus data-icon="inline-start" />
          {isSaving ? "Creando..." : "Crear versión"}
        </Button>
      </CardContent>
    </Card>
  )
}
