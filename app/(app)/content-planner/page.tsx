"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileUp,
  LinkIcon,
  Plus,
  Table2,
  Trash2,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  createContentPlanningItem,
  createContentPublishingItem,
  createContentResultItem,
  deleteContentPlanningItem,
  deleteContentPublishingItem,
  deleteContentResultItem,
  listContentPlanningItems,
  listContentPublishingItems,
  listContentResultItems,
  updateContentPublishingItem,
} from "@/lib/supabase/data"
import type {
  CreateContentPlanningItemInput,
  CreateContentPublishingItemInput,
  CreateContentResultItemInput,
} from "@/lib/supabase/data"
import {
  contentBrands,
  contentPlanningStatuses,
  contentPublishingStatuses,
  type ContentBrand,
  type ContentPlanningItem,
  type ContentPlanningStatus,
  type ContentPublishingItem,
  type ContentPublishingStatus,
  type ContentResultItem,
} from "@/lib/types"

const ALL = "all"
const DEFAULT_CHANNELS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "Newsletter"]
const PLANNING_IMPORT_COLUMNS = [
  "brand",
  "week_label",
  "target_date",
  "product_line",
  "goal",
  "format",
  "message_angle",
  "cta",
  "channel",
  "responsible",
  "planning_status",
  "notes",
]
const PUBLISHING_IMPORT_COLUMNS = [
  "brand",
  "publish_date",
  "publish_time",
  "product_line",
  "channel",
  "final_copy",
  "asset_url",
  "publishing_status",
  "notes",
]
const RESULTS_IMPORT_COLUMNS = [
  "brand",
  "week_label",
  "publish_date",
  "product_line",
  "reach",
  "impressions",
  "notes",
]
const WEEK_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
]

type PlannerTab = "planning" | "publishing" | "results"

type PlanningFormState = Omit<ContentPlanningItem, "id" | "createdAt" | "updatedAt">
type PublishingFormState = Omit<ContentPublishingItem, "id" | "createdAt" | "updatedAt">
type ResultFormState = Omit<ContentResultItem, "id" | "createdAt" | "updatedAt">
type ImportFeedback = { tone: "success" | "error"; message: string }
type ParsedImport = { headers: string[]; rows: Record<string, string>[] }
type ImportParseResult<T> = { rows: T[]; errors: string[] }
type RowParseResult<T> = { row: T; error?: never } | { error: string; row?: never }

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getWeekStart(date: Date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day

  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  return start
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  next.setHours(0, 0, 0, 0)

  return next
}

function getWeekRange(start: Date) {
  const end = addDays(start, 7)
  return { start: toDateValue(start), end: toDateValue(end) }
}

function formatDate(value: string) {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDateValue(value))
}

function formatDayHeading(value: string) {
  const formatted = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(parseDateValue(value))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function getWeekLabel(dateValue = toDateValue(new Date())) {
  const start = getWeekStart(parseDateValue(dateValue))
  return `Semana ${formatDate(toDateValue(start))}`
}

function getCurrentWeekLabel() {
  return getWeekLabel(toDateValue(new Date()))
}

function statusClass(status: string) {
  if (status.includes("publicado") || status.includes("listo")) {
    return "border-transparent bg-primary text-primary-foreground"
  }
  if (status.includes("programado") || status.includes("copy")) {
    return "border-transparent bg-secondary text-foreground"
  }
  if (status.includes("diseño")) return "border-sky-500/30 text-sky-500"
  return "border-border text-muted-foreground"
}

function emptyPlanningForm(): PlanningFormState {
  const today = toDateValue(new Date())
  return {
    brand: "Rey del Abasto",
    weekLabel: getWeekLabel(today),
    targetDate: today,
    productLine: "",
    goal: "",
    format: "",
    messageAngle: "",
    cta: "",
    channel: "",
    responsible: "",
    planningStatus: "pendiente de producción",
    notes: "",
  }
}

function emptyPublishingForm(): PublishingFormState {
  const today = toDateValue(new Date())
  return {
    planningItemId: "",
    brand: "Rey del Abasto",
    publishDate: today,
    publishTime: "",
    productLine: "",
    channel: "",
    finalCopy: "",
    assetUrl: "",
    publishingStatus: "pendiente",
    notes: "",
  }
}

function emptyResultForm(): ResultFormState {
  const today = toDateValue(new Date())
  return {
    publishingItemId: "",
    brand: "Rey del Abasto",
    weekLabel: getWeekLabel(today),
    publishDate: today,
    productLine: "",
    reach: 0,
    impressions: 0,
    notes: "",
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function normalizeImportKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function normalizeCell(value: string | undefined) {
  return (value ?? "").trim()
}

function normalizeDateCell(value: string) {
  const nextValue = normalizeCell(value)
  if (!nextValue) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(nextValue)) return nextValue

  const slashMatch = nextValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const day = Number(slashMatch[1])
    const month = Number(slashMatch[2])
    const rawYear = Number(slashMatch[3])
    const year = rawYear < 100 ? 2000 + rawYear : rawYear

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return toDateValue(new Date(year, month - 1, day))
    }
  }

  const serial = Number(nextValue)
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    return toDateValue(new Date(excelEpoch + serial * 86400000))
  }

  return nextValue
}

function normalizeIntegerCell(value: string) {
  const nextValue = normalizeCell(value)
  if (!nextValue) return 0

  const compact = nextValue.replace(/\s/g, "")
  const normalized =
    compact.includes(",") && /^\d+,\d{3}$/.test(compact)
      ? compact.replace(",", "")
      : compact.replace(/\./g, "").replace(",", ".")
  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function normalizeBrandCell(value: string): ContentBrand {
  const normalized = normalizeImportKey(value)
  const brand = contentBrands.find((item) => normalizeImportKey(item) === normalized)

  return brand ?? "Rey del Abasto"
}

function normalizePlanningStatusCell(value: string) {
  const normalized = normalizeImportKey(value)
  return contentPlanningStatuses.find((status) => normalizeImportKey(status) === normalized)
}

function normalizePublishingStatusCell(value: string) {
  const normalized = normalizeImportKey(value)
  return contentPublishingStatuses.find((status) => normalizeImportKey(status) === normalized)
}

function parseCsvMatrix(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(cell)
      cell = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)

  return rows
}

function matrixToParsedRows(matrix: string[][]): ParsedImport {
  const [headerRow, ...dataRows] = matrix
  if (!headerRow) return { headers: [], rows: [] }

  const headers = headerRow.map((header) => normalizeImportKey(header))
  const rows = dataRows
    .filter((row) => row.some((value) => normalizeCell(value)))
    .map((row) =>
      headers.reduce<Record<string, string>>((nextRow, header, index) => {
        if (header) nextRow[header] = normalizeCell(row[index])
        return nextRow
      }, {}),
    )

  return { headers, rows }
}

async function inflateZipEntry(bytes: Uint8Array, method: number) {
  if (method === 0) return bytes
  if (method !== 8) throw new Error("El XLSX usa un método de compresión no soportado.")

  if (!("DecompressionStream" in globalThis)) {
    throw new Error("Este navegador no puede leer XLSX directamente.")
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzipXlsxEntries(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const entries = new Map<string, string>()
  let endOfCentralDirectory = -1

  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66000); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOfCentralDirectory = offset
      break
    }
  }

  if (endOfCentralDirectory < 0) throw new Error("El archivo XLSX no parece válido.")

  let directoryOffset = view.getUint32(endOfCentralDirectory + 16, true)
  const decoder = new TextDecoder()

  while (directoryOffset < bytes.length && view.getUint32(directoryOffset, true) === 0x02014b50) {
    const method = view.getUint16(directoryOffset + 10, true)
    const compressedSize = view.getUint32(directoryOffset + 20, true)
    const fileNameLength = view.getUint16(directoryOffset + 28, true)
    const extraLength = view.getUint16(directoryOffset + 30, true)
    const commentLength = view.getUint16(directoryOffset + 32, true)
    const localHeaderOffset = view.getUint32(directoryOffset + 42, true)
    const fileName = decoder.decode(bytes.slice(directoryOffset + 46, directoryOffset + 46 + fileNameLength))

    if (view.getUint32(localHeaderOffset, true) === 0x04034b50) {
      const localFileNameLength = view.getUint16(localHeaderOffset + 26, true)
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true)
      const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength
      const compressed = bytes.slice(dataStart, dataStart + compressedSize)
      const inflated = await inflateZipEntry(compressed, method)
      entries.set(fileName, decoder.decode(inflated))
    }

    directoryOffset += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

function parseXml(text: string) {
  return new DOMParser().parseFromString(text, "application/xml")
}

function getFirstWorksheetPath(entries: Map<string, string>) {
  const workbook = entries.get("xl/workbook.xml")
  const rels = entries.get("xl/_rels/workbook.xml.rels")
  if (!workbook || !rels) return "xl/worksheets/sheet1.xml"

  const workbookDoc = parseXml(workbook)
  const firstSheet = workbookDoc.getElementsByTagName("sheet")[0]
  const relationshipId = firstSheet?.getAttribute("r:id")
  if (!relationshipId) return "xl/worksheets/sheet1.xml"

  const relsDoc = parseXml(rels)
  const relationships = Array.from(relsDoc.getElementsByTagName("Relationship"))
  const target = relationships.find((relationship) => relationship.getAttribute("Id") === relationshipId)?.getAttribute("Target")
  if (!target) return "xl/worksheets/sheet1.xml"

  return target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\/?xl\//, "")}`
}

function parseSharedStrings(entries: Map<string, string>) {
  const sharedStrings = entries.get("xl/sharedStrings.xml")
  if (!sharedStrings) return []

  const doc = parseXml(sharedStrings)
  return Array.from(doc.getElementsByTagName("si")).map((item) =>
    Array.from(item.getElementsByTagName("t"))
      .map((node) => node.textContent ?? "")
      .join(""),
  )
}

function getColumnIndex(cellReference: string) {
  const letters = cellReference.match(/[A-Z]+/i)?.[0] ?? ""
  return letters
    .toUpperCase()
    .split("")
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1
}

async function parseXlsxFile(file: File) {
  const entries = await unzipXlsxEntries(await file.arrayBuffer())
  const worksheet = entries.get(getFirstWorksheetPath(entries))
  if (!worksheet) throw new Error("No se encontró la primera hoja del XLSX.")

  const sharedStrings = parseSharedStrings(entries)
  const doc = parseXml(worksheet)

  return Array.from(doc.getElementsByTagName("row"))
    .map((row) => {
      const cells: string[] = []
      Array.from(row.getElementsByTagName("c")).forEach((cell) => {
        const columnIndex = getColumnIndex(cell.getAttribute("r") ?? "")
        const type = cell.getAttribute("t")
        const rawValue = cell.getElementsByTagName("v")[0]?.textContent ?? ""
        const inlineValue = Array.from(cell.getElementsByTagName("t"))
          .map((node) => node.textContent ?? "")
          .join("")

        cells[columnIndex >= 0 ? columnIndex : cells.length] =
          type === "s" ? sharedStrings[Number(rawValue)] ?? "" : type === "inlineStr" ? inlineValue : rawValue
      })

      return cells
    })
    .filter((row) => row.some((value) => normalizeCell(value)))
}

async function readImportFile(file: File, requiredColumns: string[]) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  const matrix =
    extension === "csv"
      ? parseCsvMatrix(await file.text())
      : extension === "xlsx"
        ? await parseXlsxFile(file)
        : null

  if (!matrix) {
    throw new Error("Formato no soportado. Usá un archivo .csv o .xlsx.")
  }

  const parsed = matrixToParsedRows(matrix)
  const missingColumns = requiredColumns.filter((column) => !parsed.headers.includes(column))
  if (missingColumns.length > 0) {
    throw new Error(`Faltan columnas obligatorias: ${missingColumns.join(", ")}.`)
  }

  return parsed.rows
}

function parsePlanningRow(
  row: Record<string, string>,
  index: number,
): RowParseResult<CreateContentPlanningItemInput> {
  const planningStatus = normalizePlanningStatusCell(row.planning_status)
  const targetDate = normalizeDateCell(row.target_date)
  const productLine = normalizeCell(row.product_line)

  if (!productLine) return { error: `Fila ${index}: falta product_line.` }
  if (!targetDate) return { error: `Fila ${index}: falta target_date.` }
  if (!planningStatus) return { error: `Fila ${index}: planning_status inválido.` }

  return {
    row: {
      brand: normalizeBrandCell(row.brand),
      weekLabel: normalizeCell(row.week_label) || getWeekLabel(targetDate),
      targetDate,
      productLine,
      goal: normalizeCell(row.goal),
      format: normalizeCell(row.format),
      messageAngle: normalizeCell(row.message_angle),
      cta: normalizeCell(row.cta),
      channel: normalizeCell(row.channel) || DEFAULT_CHANNELS[0],
      responsible: normalizeCell(row.responsible),
      planningStatus,
      notes: normalizeCell(row.notes),
    } satisfies CreateContentPlanningItemInput,
  }
}

function parsePublishingRow(
  row: Record<string, string>,
  index: number,
): RowParseResult<CreateContentPublishingItemInput> {
  const publishingStatus = normalizePublishingStatusCell(row.publishing_status)
  const publishDate = normalizeDateCell(row.publish_date)
  const productLine = normalizeCell(row.product_line)

  if (!productLine) return { error: `Fila ${index}: falta product_line.` }
  if (!publishDate) return { error: `Fila ${index}: falta publish_date.` }
  if (!publishingStatus) return { error: `Fila ${index}: publishing_status inválido.` }

  return {
    row: {
      planningItemId: "",
      brand: normalizeBrandCell(row.brand),
      publishDate,
      publishTime: normalizeCell(row.publish_time),
      productLine,
      channel: normalizeCell(row.channel) || DEFAULT_CHANNELS[0],
      finalCopy: normalizeCell(row.final_copy),
      assetUrl: normalizeCell(row.asset_url),
      publishingStatus,
      notes: normalizeCell(row.notes),
    } satisfies CreateContentPublishingItemInput,
  }
}

function parseResultRow(
  row: Record<string, string>,
  index: number,
): RowParseResult<CreateContentResultItemInput> {
  const publishDate = normalizeDateCell(row.publish_date)
  const productLine = normalizeCell(row.product_line)

  if (!productLine) return { error: `Fila ${index}: falta product_line.` }
  if (!publishDate) return { error: `Fila ${index}: falta publish_date.` }

  return {
    row: {
      publishingItemId: "",
      brand: normalizeBrandCell(row.brand),
      weekLabel: normalizeCell(row.week_label) || getWeekLabel(publishDate),
      publishDate,
      productLine,
      reach: normalizeIntegerCell(row.reach),
      impressions: normalizeIntegerCell(row.impressions),
      notes: normalizeCell(row.notes),
    } satisfies CreateContentResultItemInput,
  }
}

async function parsePlanningImport(file: File): Promise<ImportParseResult<CreateContentPlanningItemInput>> {
  const rows = await readImportFile(file, PLANNING_IMPORT_COLUMNS)
  const parsedRows: CreateContentPlanningItemInput[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const result = parsePlanningRow(row, index + 2)
    if (result.error) errors.push(result.error)
    else if (result.row) parsedRows.push(result.row)
  })

  return { rows: parsedRows, errors }
}

async function parsePublishingImport(file: File): Promise<ImportParseResult<CreateContentPublishingItemInput>> {
  const rows = await readImportFile(file, PUBLISHING_IMPORT_COLUMNS)
  const parsedRows: CreateContentPublishingItemInput[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const result = parsePublishingRow(row, index + 2)
    if (result.error) errors.push(result.error)
    else if (result.row) parsedRows.push(result.row)
  })

  return { rows: parsedRows, errors }
}

async function parseResultsImport(file: File): Promise<ImportParseResult<CreateContentResultItemInput>> {
  const rows = await readImportFile(file, RESULTS_IMPORT_COLUMNS)
  const parsedRows: CreateContentResultItemInput[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const result = parseResultRow(row, index + 2)
    if (result.error) errors.push(result.error)
    else if (result.row) parsedRows.push(result.row)
  })

  return { rows: parsedRows, errors }
}

function buildImportFeedback(label: string, importedCount: number, errors: string[]) {
  const failedText = errors.length ? ` Fallidas: ${errors.length}. ${errors.slice(0, 3).join(" ")}` : ""

  return `${label}: ${importedCount} filas importadas.${failedText}`
}

function ImportButton({
  label,
  onImport,
}: {
  label: string
  onImport: (file: File) => Promise<void>
}) {
  const inputId = `import-${label.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div>
      <Input
        id={inputId}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          await onImport(file)
          event.target.value = ""
        }}
      />
      <label
        htmlFor={inputId}
        className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <FileUp className="size-4" />
        {label}
      </label>
    </div>
  )
}

export default function ContentPlannerPage() {
  const [planningItems, setPlanningItems] = useState<ContentPlanningItem[]>([])
  const [publishingItems, setPublishingItems] = useState<ContentPublishingItem[]>([])
  const [resultItems, setResultItems] = useState<ContentResultItem[]>([])
  const [activeTab, setActiveTab] = useState<PlannerTab>("planning")
  const [brandFilter, setBrandFilter] = useState<typeof ALL | ContentBrand>(ALL)
  const [weekFilter, setWeekFilter] = useState(getCurrentWeekLabel())
  const [channelFilter, setChannelFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [visibleWeekStart, setVisibleWeekStart] = useState(() => getWeekStart(new Date()))
  const [planningForm, setPlanningForm] = useState<PlanningFormState>(() => emptyPlanningForm())
  const [publishingForm, setPublishingForm] = useState<PublishingFormState>(() => emptyPublishingForm())
  const [resultForm, setResultForm] = useState<ResultFormState>(() => emptyResultForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPlanner() {
      try {
        const [nextPlanning, nextPublishing, nextResults] = await Promise.all([
          listContentPlanningItems(),
          listContentPublishingItems(),
          listContentResultItems(),
        ])
        if (cancelled) return
        setPlanningItems(nextPlanning)
        setPublishingItems(nextPublishing)
        setResultItems(nextResults)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo cargar Content Planner.",
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadPlanner()

    return () => {
      cancelled = true
    }
  }, [])

  const weekRange = useMemo(() => getWeekRange(visibleWeekStart), [visibleWeekStart])
  const visibleWeekLabel = getWeekLabel(toDateValue(visibleWeekStart))
  const weekOptions = useMemo(() => {
    return Array.from(
      new Set([
        getCurrentWeekLabel(),
        visibleWeekLabel,
        ...planningItems.map((item) => item.weekLabel),
        ...resultItems.map((item) => item.weekLabel),
      ].filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "es"))
  }, [planningItems, resultItems, visibleWeekLabel])

  const channelOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...DEFAULT_CHANNELS,
        ...planningItems.map((item) => item.channel),
        ...publishingItems.map((item) => item.channel),
      ].filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "es"))
  }, [planningItems, publishingItems])

  const filteredPlanning = planningItems.filter((item) => {
    const matchesBrand = brandFilter === ALL || item.brand === brandFilter
    const matchesWeek = !weekFilter || item.weekLabel === weekFilter
    const matchesChannel = channelFilter === ALL || item.channel === channelFilter
    const matchesStatus = statusFilter === ALL || item.planningStatus === statusFilter

    return matchesBrand && matchesWeek && matchesChannel && matchesStatus
  })

  const filteredPublishing = publishingItems.filter((item) => {
    const matchesBrand = brandFilter === ALL || item.brand === brandFilter
    const matchesWeek =
      !weekFilter || getWeekLabel(item.publishDate) === weekFilter
    const matchesChannel = channelFilter === ALL || item.channel === channelFilter
    const matchesStatus = statusFilter === ALL || item.publishingStatus === statusFilter

    return matchesBrand && matchesWeek && matchesChannel && matchesStatus
  })

  const filteredResults = resultItems.filter((item) => {
    const matchesBrand = brandFilter === ALL || item.brand === brandFilter
    const matchesWeek = !weekFilter || item.weekLabel === weekFilter
    const matchesStatus = statusFilter === ALL

    return matchesBrand && matchesWeek && matchesStatus
  })

  const weekPublishing = filteredPublishing.filter(
    (item) => item.publishDate >= weekRange.start && item.publishDate < weekRange.end,
  )

  const weekPlanning = filteredPlanning.filter(
    (item) => item.targetDate >= weekRange.start && item.targetDate < weekRange.end,
  )

  const planningCalendar = Array.from({ length: 7 }, (_, index) => {
    const date = toDateValue(addDays(visibleWeekStart, index))
    const dayItems = weekPlanning
      .filter((item) => item.targetDate === date)
      .toSorted((first, second) =>
        first.productLine.localeCompare(second.productLine, "es"),
      )

    return { date, dayName: WEEK_DAYS[index], items: dayItems }
  })

  const publishingAgenda = Array.from(
    weekPublishing
      .toSorted((first, second) => {
        const dateSort = first.publishDate.localeCompare(second.publishDate)
        if (dateSort !== 0) return dateSort

        const timeSort = (first.publishTime || "99:99").localeCompare(second.publishTime || "99:99")
        if (timeSort !== 0) return timeSort

        return first.productLine.localeCompare(second.productLine, "es")
      })
      .reduce<Map<string, ContentPublishingItem[]>>((groups, item) => {
        const current = groups.get(item.publishDate) ?? []
        groups.set(item.publishDate, [...current, item])
        return groups
      }, new Map()),
  )

  const summary = {
    planning: filteredPlanning.length,
    pending: filteredPublishing.filter((item) => item.publishingStatus === "pendiente").length,
    scheduled: filteredPublishing.filter((item) => item.publishingStatus === "programado").length,
    published: filteredPublishing.filter((item) => item.publishingStatus === "publicado").length,
    reach: filteredResults.reduce((total, item) => total + item.reach, 0),
    impressions: filteredResults.reduce((total, item) => total + item.impressions, 0),
  }

  const statusOptions =
    activeTab === "planning"
      ? contentPlanningStatuses
      : activeTab === "publishing"
        ? contentPublishingStatuses
        : []

  const selectWeekFilter = (value: string | null) => {
    if (value === ALL || !value) {
      setWeekFilter("")
      return
    }

    setWeekFilter(value)

    const planningMatch = planningItems.find((item) => item.weekLabel === value)
    const publishingMatch = publishingItems.find(
      (item) => getWeekLabel(item.publishDate) === value,
    )
    const resultMatch = resultItems.find((item) => item.weekLabel === value)
    const dateValue =
      planningMatch?.targetDate ??
      publishingMatch?.publishDate ??
      resultMatch?.publishDate

    if (dateValue) setVisibleWeekStart(getWeekStart(parseDateValue(dateValue)))
  }

  const moveVisibleWeek = (days: number) => {
    setVisibleWeekStart((current) => {
      const next = addDays(current, days)
      setWeekFilter(getWeekLabel(toDateValue(next)))
      return next
    })
  }

  const showCurrentWeek = () => {
    const current = getWeekStart(new Date())
    setVisibleWeekStart(current)
    setWeekFilter(getWeekLabel(toDateValue(current)))
  }

  const createPlanning = async () => {
    if (!planningForm.productLine.trim()) return
    setIsSaving(true)
    setError("")
    setImportFeedback(null)
    try {
      const created = await createContentPlanningItem({
        ...planningForm,
        productLine: planningForm.productLine.trim(),
        goal: planningForm.goal.trim(),
        format: planningForm.format.trim(),
        messageAngle: planningForm.messageAngle.trim(),
        cta: planningForm.cta.trim(),
        channel: planningForm.channel.trim(),
        responsible: planningForm.responsible.trim(),
        notes: planningForm.notes.trim(),
      })
      setPlanningItems((current) => [...current, created])
      setPlanningForm(emptyPlanningForm())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la planificación.")
    } finally {
      setIsSaving(false)
    }
  }

  const createPublishing = async () => {
    if (!publishingForm.productLine.trim()) return
    setIsSaving(true)
    setError("")
    setImportFeedback(null)
    try {
      const created = await createContentPublishingItem({
        ...publishingForm,
        productLine: publishingForm.productLine.trim(),
        channel: publishingForm.channel.trim(),
        finalCopy: publishingForm.finalCopy.trim(),
        assetUrl: publishingForm.assetUrl.trim(),
        notes: publishingForm.notes.trim(),
      })
      setPublishingItems((current) => [...current, created])
      setPublishingForm(emptyPublishingForm())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la publicación.")
    } finally {
      setIsSaving(false)
    }
  }

  const createResult = async () => {
    if (!resultForm.productLine.trim()) return
    setIsSaving(true)
    setError("")
    setImportFeedback(null)
    try {
      const created = await createContentResultItem({
        ...resultForm,
        productLine: resultForm.productLine.trim(),
        notes: resultForm.notes.trim(),
      })
      setResultItems((current) => [...current, created])
      setResultForm(emptyResultForm())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el resultado.")
    } finally {
      setIsSaving(false)
    }
  }

  const importPlanningFile = async (file: File) => {
    setIsSaving(true)
    setError("")
    setImportFeedback(null)

    try {
      const parsed = await parsePlanningImport(file)
      const createdItems: ContentPlanningItem[] = []
      const errors = [...parsed.errors]

      for (const row of parsed.rows) {
        try {
          createdItems.push(await createContentPlanningItem(row))
        } catch (caught) {
          errors.push(caught instanceof Error ? caught.message : "No se pudo importar una fila.")
        }
      }

      if (createdItems.length > 0) {
        setPlanningItems((current) => [...current, ...createdItems])
      }

      setImportFeedback({
        tone: errors.length ? "error" : "success",
        message: buildImportFeedback("Planificación", createdItems.length, errors),
      })
    } catch (caught) {
      setImportFeedback({
        tone: "error",
        message: `Planificación: 0 filas importadas. ${
          caught instanceof Error ? caught.message : "No se pudo importar planificación."
        }`,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const importPublishingFile = async (file: File) => {
    setIsSaving(true)
    setError("")
    setImportFeedback(null)

    try {
      const parsed = await parsePublishingImport(file)
      const createdItems: ContentPublishingItem[] = []
      const errors = [...parsed.errors]

      for (const row of parsed.rows) {
        try {
          createdItems.push(await createContentPublishingItem(row))
        } catch (caught) {
          errors.push(caught instanceof Error ? caught.message : "No se pudo importar una fila.")
        }
      }

      if (createdItems.length > 0) {
        setPublishingItems((current) => [...current, ...createdItems])
      }

      setImportFeedback({
        tone: errors.length ? "error" : "success",
        message: buildImportFeedback("Publicación", createdItems.length, errors),
      })
    } catch (caught) {
      setImportFeedback({
        tone: "error",
        message: `Publicación: 0 filas importadas. ${
          caught instanceof Error ? caught.message : "No se pudo importar publicación."
        }`,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const importResultsFile = async (file: File) => {
    setIsSaving(true)
    setError("")
    setImportFeedback(null)

    try {
      const parsed = await parseResultsImport(file)
      const createdItems: ContentResultItem[] = []
      const errors = [...parsed.errors]

      for (const row of parsed.rows) {
        try {
          createdItems.push(await createContentResultItem(row))
        } catch (caught) {
          errors.push(caught instanceof Error ? caught.message : "No se pudo importar una fila.")
        }
      }

      if (createdItems.length > 0) {
        setResultItems((current) => [...current, ...createdItems])
      }

      setImportFeedback({
        tone: errors.length ? "error" : "success",
        message: buildImportFeedback("Resultados", createdItems.length, errors),
      })
    } catch (caught) {
      setImportFeedback({
        tone: "error",
        message: `Resultados: 0 filas importadas. ${
          caught instanceof Error ? caught.message : "No se pudo importar resultados."
        }`,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Planner"
        description="Planificación, publicación y resultados semanales."
      />

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {importFeedback ? (
        <Card>
          <CardContent
            className={`py-4 text-sm ${
              importFeedback.tone === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {importFeedback.message}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select value={brandFilter} onValueChange={(value) => setBrandFilter(value as typeof brandFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {contentBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Semana</Label>
            <Select value={weekFilter || ALL} onValueChange={selectWeekFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {weekOptions.map((week) => (
                  <SelectItem key={week} value={week}>{week}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value ?? ALL)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {channelOptions.map((channel) => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? ALL)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Planificación semana" value={summary.planning} />
        <Metric label="Pendientes" value={summary.pending} />
        <Metric label="Programadas" value={summary.scheduled} />
        <Metric label="Publicadas" value={summary.published} />
        <Metric label="Alcance total" value={summary.reach} />
        <Metric label="Impresiones" value={summary.impressions} />
      </div>

      {isLoading ? (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">Cargando Content Planner...</CardContent></Card>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as PlannerTab)
        setStatusFilter(ALL)
      }}>
        <TabsList>
          <TabsTrigger value="planning">Planificación</TabsTrigger>
          <TabsTrigger value="publishing">Publicación</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Reunión del lunes</CardTitle>
              <ImportButton label="Importar CSV/XLSX" onImport={importPlanningFile} />
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              <Select value={planningForm.brand} onValueChange={(value) => setPlanningForm((current) => ({ ...current, brand: value as ContentBrand }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contentBrands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={planningForm.weekLabel} onChange={(event) => setPlanningForm((current) => ({ ...current, weekLabel: event.target.value }))} placeholder="Semana" />
              <Input type="date" value={planningForm.targetDate} onChange={(event) => setPlanningForm((current) => ({ ...current, targetDate: event.target.value, weekLabel: getWeekLabel(event.target.value) }))} />
              <Input value={planningForm.productLine} onChange={(event) => setPlanningForm((current) => ({ ...current, productLine: event.target.value }))} placeholder="Producto" />
              <Input value={planningForm.goal} onChange={(event) => setPlanningForm((current) => ({ ...current, goal: event.target.value }))} placeholder="Objetivo" />
              <Input value={planningForm.format} onChange={(event) => setPlanningForm((current) => ({ ...current, format: event.target.value }))} placeholder="Formato" />
              <Input value={planningForm.messageAngle} onChange={(event) => setPlanningForm((current) => ({ ...current, messageAngle: event.target.value }))} placeholder="Enfoque" />
              <Input value={planningForm.cta} onChange={(event) => setPlanningForm((current) => ({ ...current, cta: event.target.value }))} placeholder="CTA" />
              <Input value={planningForm.channel} onChange={(event) => setPlanningForm((current) => ({ ...current, channel: event.target.value }))} placeholder="Canal" />
              <Input value={planningForm.responsible} onChange={(event) => setPlanningForm((current) => ({ ...current, responsible: event.target.value }))} placeholder="Responsable" />
              <Select value={planningForm.planningStatus} onValueChange={(value) => setPlanningForm((current) => ({ ...current, planningStatus: value as ContentPlanningStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contentPlanningStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="md:col-span-2 xl:col-span-2" value={planningForm.notes} onChange={(event) => setPlanningForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" />
              <Button onClick={createPlanning} disabled={isSaving || !planningForm.productLine.trim()} className="gap-2 md:col-span-3 xl:col-span-6">
                <Plus className="size-4" /> Agregar planificación
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" /> Calendario semanal</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(weekRange.start)} - {formatDate(toDateValue(addDays(parseDateValue(weekRange.end), -1)))}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => moveVisibleWeek(-7)} title="Semana anterior" aria-label="Semana anterior">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={showCurrentWeek}>
                  Semana actual
                </Button>
                <Button variant="outline" size="sm" onClick={() => moveVisibleWeek(7)} title="Semana siguiente" aria-label="Semana siguiente">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid min-w-[920px] grid-cols-7 gap-2 lg:min-w-0">
                  {planningCalendar.map((day) => (
                    <section key={day.date} className="flex min-h-56 flex-col rounded-lg border border-border bg-background/40">
                      <div className="border-b border-border px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{day.dayName}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(day.date).replace(/ de /g, " ")}</p>
                          </div>
                          <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
                            {day.items.length}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2">
                        {day.items.map((item) => (
                          <div key={item.id} className="rounded-md border border-border bg-card px-2 py-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-xs font-medium">{item.productLine}</p>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-destructive"
                                title="Eliminar planificación"
                                aria-label="Eliminar planificación"
                                onClick={async () => {
                                  await deleteContentPlanningItem(item.id)
                                  setPlanningItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {day.items.length === 0 ? (
                          <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground">
                            Sin publicaciones
                          </p>
                        ) : null}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
              {weekPlanning.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No hay planificación para esta semana con los filtros actuales.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {filteredPlanning.length > weekPlanning.length ? (
            <p className="text-xs text-muted-foreground">
              Hay {filteredPlanning.length - weekPlanning.length} items que coinciden con los filtros pero están fuera de la semana visible.
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="publishing" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Cronograma de publicación</CardTitle>
              <ImportButton label="Importar CSV/XLSX" onImport={importPublishingFile} />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <Select value={publishingForm.brand} onValueChange={(value) => setPublishingForm((current) => ({ ...current, brand: value as ContentBrand }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contentBrands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={publishingForm.publishDate} onChange={(event) => setPublishingForm((current) => ({ ...current, publishDate: event.target.value }))} />
              <Input type="time" value={publishingForm.publishTime} onChange={(event) => setPublishingForm((current) => ({ ...current, publishTime: event.target.value }))} />
              <Input value={publishingForm.productLine} onChange={(event) => setPublishingForm((current) => ({ ...current, productLine: event.target.value }))} placeholder="Producto" />
              <Input value={publishingForm.channel} onChange={(event) => setPublishingForm((current) => ({ ...current, channel: event.target.value }))} placeholder="Canal" />
              <Select value={publishingForm.publishingStatus} onValueChange={(value) => setPublishingForm((current) => ({ ...current, publishingStatus: value as ContentPublishingStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contentPublishingStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={publishingForm.assetUrl} onChange={(event) => setPublishingForm((current) => ({ ...current, assetUrl: event.target.value }))} placeholder="Asset URL" />
              <Input value={publishingForm.notes} onChange={(event) => setPublishingForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" />
              <Textarea className="md:col-span-3 xl:col-span-4" rows={2} value={publishingForm.finalCopy} onChange={(event) => setPublishingForm((current) => ({ ...current, finalCopy: event.target.value }))} placeholder="Copy final" />
              <Button onClick={createPublishing} disabled={isSaving || !publishingForm.productLine.trim()} className="gap-2 md:col-span-3 xl:col-span-4">
                <Plus className="size-4" /> Agregar publicación
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" /> Agenda por día</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(weekRange.start)} - {formatDate(toDateValue(addDays(parseDateValue(weekRange.end), -1)))}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setVisibleWeekStart((current) => addDays(current, -7))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setVisibleWeekStart(getWeekStart(new Date()))}>
                  Semana actual
                </Button>
                <Button variant="outline" size="sm" onClick={() => setVisibleWeekStart((current) => addDays(current, 7))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {publishingAgenda.map(([date, dayItems]) => (
                  <section key={date} className="rounded-lg border border-border p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{formatDayHeading(date)}</p>
                      <Badge variant="outline">{dayItems.length} publicaciones</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {dayItems.map((item) => (
                        <div key={item.id} className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-[72px_1fr_auto] md:items-start">
                          <p className="text-xs text-muted-foreground">{item.publishTime || "Sin hora"}</p>
                          <div>
                            <p className="line-clamp-1 text-sm font-medium">{item.productLine}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.finalCopy || item.notes || "Sin copy final."}</p>
                            {item.assetUrl ? (
                              <a href={item.assetUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                <LinkIcon className="size-3" /> Asset
                              </a>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-1.5 md:justify-end">
                            <Badge variant="outline" className="text-[11px]">{item.channel}</Badge>
                            <Badge variant="outline" className={`text-[11px] ${statusClass(item.publishingStatus)}`}>{item.publishingStatus}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
                {publishingAgenda.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No hay publicaciones agendadas para esta semana con los filtros actuales.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {filteredPublishing.map((item) => (
              <Card key={item.id}>
                <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.productLine}</p>
                      <Badge variant="outline">{item.brand}</Badge>
                      <Badge variant="outline" className={statusClass(item.publishingStatus)}>{item.publishingStatus}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.publishDate)} · {item.publishTime || "Sin hora"} · {item.channel}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.finalCopy || "Sin copy final."}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.publishingStatus !== "publicado" ? (
                      <Button size="sm" onClick={async () => {
                        const updated = await updateContentPublishingItem(item.id, { publishingStatus: "publicado" })
                        setPublishingItems((current) => current.map((currentItem) => currentItem.id === item.id ? updated : currentItem))
                      }}>
                        <CheckCircle2 className="size-4" />
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                      await deleteContentPublishingItem(item.id)
                      setPublishingItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
                    }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredPublishing.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No hay publicaciones con estos filtros.</p> : null}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Resultados básicos</CardTitle>
              <ImportButton label="Importar CSV/XLSX" onImport={importResultsFile} />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <Select value={resultForm.brand} onValueChange={(value) => setResultForm((current) => ({ ...current, brand: value as ContentBrand }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{contentBrands.map((brand) => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={resultForm.weekLabel} onChange={(event) => setResultForm((current) => ({ ...current, weekLabel: event.target.value }))} placeholder="Semana" />
              <Input type="date" value={resultForm.publishDate} onChange={(event) => setResultForm((current) => ({ ...current, publishDate: event.target.value, weekLabel: getWeekLabel(event.target.value) }))} />
              <Input value={resultForm.productLine} onChange={(event) => setResultForm((current) => ({ ...current, productLine: event.target.value }))} placeholder="Producto" />
              <Input type="number" min={0} value={resultForm.reach} onChange={(event) => setResultForm((current) => ({ ...current, reach: Number(event.target.value) }))} placeholder="Alcance" />
              <Input type="number" min={0} value={resultForm.impressions} onChange={(event) => setResultForm((current) => ({ ...current, impressions: Number(event.target.value) }))} placeholder="Impresiones" />
              <Input className="md:col-span-3 xl:col-span-2" value={resultForm.notes} onChange={(event) => setResultForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" />
              <Button onClick={createResult} disabled={isSaving || !resultForm.productLine.trim()} className="gap-2 md:col-span-3 xl:col-span-4">
                <Plus className="size-4" /> Agregar resultado
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {filteredResults.map((item) => (
              <Card key={item.id}>
                <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.productLine}</p>
                      <Badge variant="outline">{item.brand}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.weekLabel} · {formatDate(item.publishDate)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1"><BarChart3 className="size-3" /> Alcance {item.reach}</Badge>
                      <Badge variant="outline">Impresiones {item.impressions}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                    await deleteContentResultItem(item.id)
                    setResultItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
                  }}>
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredResults.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No hay resultados con estos filtros.</p> : null}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="flex items-start gap-2 p-4 text-xs text-muted-foreground">
          <Table2 className="mt-0.5 size-4 shrink-0" />
          <p>
            La importación CSV es manual y espera encabezados simples como marca, semana, fecha,
            producto, objetivo, canal, alcance o impresiones. También acepta XLSX con la primera hoja
            usando las columnas de plantilla. No hay integración automática con Google Drive todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
