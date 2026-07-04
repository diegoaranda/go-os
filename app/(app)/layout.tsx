import type React from "react"
import { Sidebar, BottomNav } from "@/components/app-nav"
import { AppStoreProvider } from "@/lib/store"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex h-14 items-center gap-2 border-b border-border px-4 md:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold">Go</span>
            </div>
            <span className="text-sm font-semibold">Go OS</span>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </AppStoreProvider>
  )
}
