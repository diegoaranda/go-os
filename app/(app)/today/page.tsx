"use client"

import { PageHeader } from "@/components/page-header"
import { TaskRow } from "@/components/task-row"
import { useAppStore } from "@/lib/store"
import type { Task } from "@/lib/types"

function Section({
  title,
  description,
  items,
  projectName,
}: {
  title: string
  description: string
  items: Task[]
  projectName: (id: string) => string
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((task) => (
            <TaskRow key={task.id} task={task} projectName={projectName} />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nada por aquí.
          </p>
        )}
      </div>
    </section>
  )
}

export default function TodayPage() {
  const { tasks, projectName } = useAppStore()
  const siOSi = tasks
    .filter(
      (task) =>
        task.due === "Hoy" &&
        task.status !== "Terminado" &&
        task.status !== "Bloqueado",
    )
    .slice(0, 3)
  const siAvanzo = tasks.filter(
    (task) =>
      (task.due === "Mañana" || task.due === "Esta semana") &&
      task.status !== "Bloqueado" &&
      task.status !== "Terminado",
  )
  const bloqueado = tasks.filter((task) => task.status === "Bloqueado")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description="Enfócate en lo esencial. Máximo tres cosas que sí o sí tienen que pasar hoy."
      />
      <div className="space-y-8">
        <Section
          title="Hoy sí o sí"
          description="Las 3 tareas no negociables del día."
          items={siOSi}
          projectName={projectName}
        />
        <Section
          title="Si avanzo más"
          description="Tareas extra para adelantar si queda tiempo."
          items={siAvanzo}
          projectName={projectName}
        />
        <Section
          title="Esperando / bloqueado"
          description="Depende de terceros o de algo pendiente."
          items={bloqueado}
          projectName={projectName}
        />
      </div>
    </div>
  )
}
