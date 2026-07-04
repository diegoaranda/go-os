"use client"

import { useState } from "react"
import { Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuickCapture } from "@/components/quick-capture"
import { useAppStore } from "@/lib/store"

export function InboxCaptureCard() {
  const { addInboxItem } = useAppStore()
  const [recent, setRecent] = useState<string[]>([])
  const capture = (value: string) => {
    addInboxItem(value)
    setRecent((current) => [value, ...current].slice(0, 3))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="size-4 text-primary" />
          Captura rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <QuickCapture onCapture={capture} />
        {recent.length > 0 ? (
          <ul className="space-y-1.5">
            {recent.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-md bg-secondary/40 px-3 py-2 text-sm text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Lo que captures aparecerá en tu Inbox para procesar después.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
