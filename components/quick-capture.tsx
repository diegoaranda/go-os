"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function QuickCapture({
  onCapture,
  compact = false,
}: {
  onCapture?: (value: string) => void
  compact?: boolean
}) {
  const [value, setValue] = useState("")

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onCapture?.(trimmed)
    setValue("")
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Escribe una idea, pendiente o recordatorio…"
        aria-label="Captura rápida"
        className="bg-background"
      />
      <Button onClick={submit} size={compact ? "sm" : "default"} className="shrink-0">
        <Plus className="size-4" />
        <span className={compact ? "sr-only" : ""}>Capturar</span>
      </Button>
    </div>
  )
}
