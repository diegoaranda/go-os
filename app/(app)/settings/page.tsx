"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Plus, X, MessageCircle, ListTodo } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { quickLinks } from "@/lib/data"
import { accessReferences } from "@/lib/mock-data"
import { getSupabaseClient } from "@/lib/supabase/client"

function getMetadataValue(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
) {
  if (!metadata) return ""

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }

  return ""
}

function getInitials(email: string, name: string) {
  const source = name || email
  const parts = source
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function SettingSwitch({
  label,
  description,
  defaultChecked = false,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [links, setLinks] = useState(quickLinks.map((l) => l.label))
  const [newLink, setNewLink] = useState("")
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isAccountLoading, setIsAccountLoading] = useState(true)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [accountEmail, setAccountEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [draftName, setDraftName] = useState("")
  const [accountError, setAccountError] = useState("")
  const [accountSuccess, setAccountSuccess] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadAccount() {
      setAccountError("")
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.getUser()

        if (error) throw error
        if (!data.user) throw new Error("No hay usuario autenticado.")
        if (cancelled) return

        const metadata = data.user.user_metadata
        const name = getMetadataValue(metadata, [
          "display_name",
          "full_name",
          "name",
        ])

        setAccountEmail(data.user.email ?? "")
        setDisplayName(name)
        setDraftName(name)
      } catch (caught) {
        if (!cancelled) {
          setAccountError(
            caught instanceof Error
              ? caught.message
              : "No se pudo cargar la cuenta.",
          )
        }
      } finally {
        if (!cancelled) setIsAccountLoading(false)
      }
    }

    loadAccount()

    return () => {
      cancelled = true
    }
  }, [])

  const addLink = () => {
    const v = newLink.trim()
    if (!v) return
    setLinks((prev) => [...prev, v])
    setNewLink("")
  }

  const signOut = async () => {
    setIsSigningOut(true)
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    await fetch("/api/auth/session", { method: "DELETE" })
    router.replace("/login")
  }

  const saveProfile = async () => {
    const name = draftName.trim()
    setAccountError("")
    setAccountSuccess("")
    setIsProfileSaving(true)

    try {
      const supabase = getSupabaseClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!userData.user) throw new Error("No hay usuario autenticado.")

      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...userData.user.user_metadata,
          display_name: name,
          full_name: name,
          name,
        },
      })

      if (error) throw error

      const metadata = data.user.user_metadata
      const nextName = getMetadataValue(metadata, [
        "display_name",
        "full_name",
        "name",
      ])

      setDisplayName(nextName)
      setDraftName(nextName)
      setAccountSuccess("Perfil actualizado.")
    } catch (caught) {
      setAccountError(
        caught instanceof Error
          ? caught.message
          : "No se pudo actualizar el perfil.",
      )
    } finally {
      setIsProfileSaving(false)
    }
  }

  const initials = getInitials(accountEmail, displayName)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configura tu perfil, preferencias e integraciones de Go OS."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
            <CardDescription>Tu información personal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                {initials || "GO"}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isAccountLoading ? "Cargando cuenta..." : displayName || "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {accountEmail || "Email no disponible"}
                </p>
              </div>
            </div>
            {accountError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {accountError}
              </p>
            ) : null}
            {accountSuccess ? (
              <p className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
                {accountSuccess}
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              disabled={isSigningOut}
              className="w-fit gap-1"
            >
              <LogOut className="size-4" />
              {isSigningOut ? "Saliendo..." : "Cerrar sesión"}
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={draftName}
                  onChange={(event) => {
                    setDraftName(event.target.value)
                    setAccountSuccess("")
                  }}
                  placeholder="Nombre visible"
                  disabled={isAccountLoading || isProfileSaving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={accountEmail} readOnly />
              </div>
            </div>
            <Button
              size="sm"
              onClick={saveProfile}
              disabled={
                isAccountLoading ||
                isProfileSaving ||
                draftName.trim() === displayName
              }
            >
              {isProfileSaving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </CardContent>
        </Card>

        {/* App preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferencias</CardTitle>
            <CardDescription>Ajusta el comportamiento de la app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingSwitch
              label="Modo oscuro"
              description="Interfaz oscura por defecto."
              defaultChecked
            />
            <Separator />
            <SettingSwitch
              label="Resumen diario"
              description="Recibe un resumen de tus prioridades cada mañana."
              defaultChecked
            />
            <Separator />
            <SettingSwitch
              label="Recordatorios de bloqueados"
              description="Avisar cuando una tarea lleve mucho tiempo bloqueada."
            />
          </CardContent>
        </Card>

        {/* ClickUp integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="size-4 text-primary" />
                ClickUp
              </CardTitle>
              <Badge variant="outline" className="border-transparent bg-secondary text-muted-foreground">
                No conectado
              </Badge>
            </div>
            <CardDescription>
              Sincroniza tareas desde ClickUp automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="clickup">API Token</Label>
              <Input id="clickup" placeholder="pk_..." disabled />
            </div>
            <Button variant="outline" size="sm" disabled>
              Conectar ClickUp
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp assistant */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="size-4 text-primary" />
                Asistente de WhatsApp
              </CardTitle>
              <Badge variant="outline" className="border-transparent bg-secondary text-muted-foreground">
                Próximamente
              </Badge>
            </div>
            <CardDescription>
              Captura ideas y pendientes enviando mensajes a tu asistente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="wa">Número de WhatsApp</Label>
              <Input id="wa" placeholder="+54 ..." disabled />
            </div>
            <Button variant="outline" size="sm" disabled>
              Configurar asistente
            </Button>
          </CardContent>
        </Card>

        {/* Access references */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Access References</CardTitle>
            <CardDescription>
              Referencias de acceso sin guardar contraseñas reales en Go OS.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {accessReferences.map((reference) => (
              <div
                key={reference.id}
                className="rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{reference.platform}</p>
                    <p className="text-xs text-muted-foreground">{reference.account}</p>
                  </div>
                  <Badge variant="outline" className="border-transparent bg-secondary text-muted-foreground">
                    {reference.storedIn}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{reference.note}</p>
                <a
                  href={reference.loginUrl}
                  className="mt-2 block truncate text-xs font-medium text-primary hover:underline"
                >
                  {reference.loginUrl}
                </a>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick links management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
            <CardDescription>
              Administra los enlaces que aparecen en tu dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Badge
                  key={link}
                  variant="outline"
                  className="gap-1.5 border-border bg-secondary/40 py-1 pl-2.5 pr-1 text-sm font-normal"
                >
                  {link}
                  <button
                    type="button"
                    onClick={() => setLinks((prev) => prev.filter((l) => l !== link))}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Quitar ${link}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault()
                    addLink()
                  }
                }}
                placeholder="Nombre del acceso rápido…"
                className="max-w-xs"
              />
              <Button size="sm" onClick={addLink} className="gap-1">
                <Plus className="size-4" />
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
