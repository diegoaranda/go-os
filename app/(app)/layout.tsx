import type React from "react"
import { Sidebar, BottomNav } from "@/components/app-nav"
import { AppStoreProvider } from "@/lib/store"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold">Go</span>
            </div>
            <span className="text-sm font-semibold">Go OS</span>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8 lg:px-8">
              {children}
            </div>
          </main>
          <BottomNav />
        </div>
      </div>
    </AppStoreProvider>
  )
}
