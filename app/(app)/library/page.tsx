import {
  FileText,
  ImageIcon,
  LinkIcon,
  StickyNote,
  ExternalLink,
  File as FileIcon,
  Frame,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyStatusBadge, AssetTypeBadge } from "@/components/status-badge"
import {
  libraryCopies,
  libraryAssets,
  libraryLinks,
  libraryNotes,
  projectName,
  type AssetType,
} from "@/lib/data"

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <Badge
          key={t}
          variant="outline"
          className="border-border bg-secondary/40 px-1.5 py-0 text-[11px] font-normal text-muted-foreground"
        >
          #{t}
        </Badge>
      ))}
    </div>
  )
}

const assetIcon: Record<AssetType, typeof ImageIcon> = {
  Imagen: ImageIcon,
  PDF: FileIcon,
  Mockup: Frame,
  Referencia: LinkIcon,
}

function CopysTab() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {libraryCopies.map((c) => (
        <Card key={c.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {projectName(c.projectId)}
                </p>
              </div>
              <CopyStatusBadge status={c.status} />
            </div>
            <p className="text-pretty rounded-md bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              {c.preview}
            </p>
            <div className="flex items-center justify-between gap-2">
              <TagList tags={c.tags} />
              <span className="shrink-0 text-xs text-muted-foreground">{c.date}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AssetsTab() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {libraryAssets.map((a) => {
        const Icon = assetIcon[a.type]
        return (
          <Card key={a.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-center rounded-lg border border-border bg-secondary/40 py-6">
                <Icon className="size-8 text-muted-foreground" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {projectName(a.projectId)}
                  </p>
                </div>
                <AssetTypeBadge type={a.type} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <TagList tags={a.tags} />
                <span className="shrink-0 text-xs text-muted-foreground">{a.date}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function LinksTab() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {libraryLinks.map((l) => (
        <Card key={l.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {projectName(l.projectId)}
                </p>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 border-transparent bg-secondary text-muted-foreground"
              >
                {l.category}
              </Badge>
            </div>
            <a
              href={l.url}
              className="flex items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline"
            >
              <LinkIcon className="size-3 shrink-0" />
              <span className="truncate">{l.url}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
            <p className="text-xs text-muted-foreground">{l.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function NotesTab() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {libraryNotes.map((n) => (
        <Card key={n.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">
                  {projectName(n.projectId)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{n.date}</span>
            </div>
            <p className="text-pretty rounded-md bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              {n.preview}
            </p>
            <TagList tags={n.tags} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Recursos operativos que no son tareas: copys, assets, links y notas."
      />

      <Tabs defaultValue="copys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="copys" className="gap-1.5">
            <FileText className="size-4" />
            Copys
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1.5">
            <ImageIcon className="size-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5">
            <LinkIcon className="size-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="size-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <Separator />

        <TabsContent value="copys">
          <CopysTab />
        </TabsContent>
        <TabsContent value="assets">
          <AssetsTab />
        </TabsContent>
        <TabsContent value="links">
          <LinksTab />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
