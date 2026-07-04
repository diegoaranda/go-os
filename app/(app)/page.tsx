import {
  PriorityTasksCard,
  ActiveProjectsCard,
  ContentSummaryCard,
  QuickLinksCard,
  WeeklyProgressCard,
  LatestLibraryCard,
} from "@/components/dashboard-cards"
import { InboxCaptureCard } from "@/components/inbox-capture-card"

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Go OS
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Tu centro de operaciones personal. Esto es lo que importa hoy.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <PriorityTasksCard />
            <ActiveProjectsCard />
          </div>
          <ContentSummaryCard />
          <LatestLibraryCard />
          <InboxCaptureCard />
        </div>
        <div className="space-y-4">
          <WeeklyProgressCard />
          <QuickLinksCard />
        </div>
      </div>
    </div>
  )
}
