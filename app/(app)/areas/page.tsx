"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { ContextualLibrarySection } from "@/components/contextual-library-section"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createLibraryItem,
  createArea,
  deleteArea,
  deleteLibraryItem,
  listAreas,
  listLibraryItems,
  listProjects,
  updateArea,
} from "@/lib/supabase/data"
import type { Area, KnowledgeLibraryItem, Project } from "@/lib/types"

function AreaForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Area
  onSubmit: (input: Omit<Area, "id">) => void | Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSubmitting(true)

    try {
      await onSubmit({ name: trimmed })
      if (!initial) setName("")
    } catch {
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={initial ? `area-${initial.id}` : "new-area"}>Área</Label>
        <Input
          id={initial ? `area-${initial.id}` : "new-area"}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault()
              void submit()
            }
          }}
          placeholder="Ej: Operaciones, Finanzas, Producto"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={submit} size="sm" className="gap-1" disabled={isSubmitting}>
          {initial ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {isSubmitting ? "Guardando..." : initial ? "Guardar" : "Crear"}
        </Button>
        {onCancel ? (
          <Button onClick={onCancel} variant="ghost" size="sm" className="gap-1">
            <X className="size-4" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [libraryItems, setLibraryItems] = useState<KnowledgeLibraryItem[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [nextAreas, nextProjects, nextLibraryItems] = await Promise.all([
          listAreas(),
          listProjects(),
          listLibraryItems(),
        ])
        if (cancelled) return
        setAreas(nextAreas)
        setProjects(nextProjects)
        setLibraryItems(nextLibraryItems)
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "No se pudieron cargar las áreas.")
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

  const projectCountByArea = useMemo(() => {
    return projects.reduce<Record<string, number>>((counts, project) => {
      if (!project.areaId) return counts
      counts[project.areaId] = (counts[project.areaId] ?? 0) + 1
      return counts
    }, {})
  }, [projects])

  const libraryItemsByArea = useMemo(() => {
    return libraryItems.reduce<Record<string, KnowledgeLibraryItem[]>>((groups, item) => {
      if (!item.areaId) return groups
      groups[item.areaId] = [...(groups[item.areaId] ?? []), item]
      return groups
    }, {})
  }, [libraryItems])

  const createSupabaseArea = async (input: Omit<Area, "id">) => {
    setError("")
    try {
      const area = await createArea(input)
      setAreas((current) => [...current, area])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el área.")
      throw caught
    }
  }

  const updateSupabaseArea = async (id: string, input: Omit<Area, "id">) => {
    setError("")
    try {
      const area = await updateArea(id, input)
      setAreas((current) =>
        current.map((currentArea) => (currentArea.id === id ? area : currentArea)),
      )
      setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el área.")
      throw caught
    }
  }

  const createAreaLibraryItem = async (
    input: Omit<KnowledgeLibraryItem, "id" | "createdAt">,
  ) => {
    setError("")
    try {
      const item = await createLibraryItem(input)
      setLibraryItems((current) => [item, ...current])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el recurso.")
      throw caught
    }
  }

  const deleteAreaLibraryItem = async (id: string) => {
    const shouldDelete = window.confirm("¿Eliminar este recurso?")
    if (!shouldDelete) return

    setError("")
    try {
      await deleteLibraryItem(id)
      setLibraryItems((current) => current.filter((item) => item.id !== id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el recurso.")
    }
  }

  const deleteSupabaseArea = async (id: string) => {
    const shouldDelete = window.confirm(
      "¿Eliminar esta área? Los proyectos asociados quedarán sin área.",
    )
    if (!shouldDelete) return

    setError("")
    try {
      await deleteArea(id)
      setAreas((current) => current.filter((area) => area.id !== id))
      setProjects((current) =>
        current.map((project) =>
          project.areaId === id ? { ...project, areaId: "" } : project,
        ),
      )
      setLibraryItems((current) =>
        current.map((item) => (item.areaId === id ? { ...item, areaId: "" } : item)),
      )
      if (editing === id) setEditing(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar el área.")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Areas"
        description="Organiza Go OS por áreas de responsabilidad."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear área</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaForm onSubmit={createSupabaseArea} />
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Cargando áreas...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && areas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay áreas todavía.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => {
          const projectCount = projectCountByArea[area.id] ?? 0

          return (
            <Card key={area.id}>
              <CardContent className="space-y-4 p-4">
                {editing === area.id ? (
                  <AreaForm
                    initial={area}
                    onSubmit={(input) => updateSupabaseArea(area.id, input)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold">{area.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {projectCount} {projectCount === 1 ? "proyecto" : "proyectos"}
                        </p>
                      </div>
                    </div>
                    <ContextualLibrarySection
                      items={libraryItemsByArea[area.id] ?? []}
                      defaultAreaId={area.id}
                      onCreate={createAreaLibraryItem}
                      onDelete={deleteAreaLibraryItem}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(area.id)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Pencil className="size-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void deleteSupabaseArea(area.id)
                        }}
                        className="h-7 gap-1 px-2 text-xs text-destructive"
                      >
                        <Trash2 className="size-3" />
                        Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
