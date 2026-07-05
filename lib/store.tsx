"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  initialInboxItems,
  initialProjects,
  initialRdaContentItems,
  initialTasks,
} from "@/lib/mock-data"
import type {
  InboxItem,
  Project,
  RdaContentItem,
  Task,
} from "@/lib/types"
import {
  priorities as sharedPriorities,
  projectStatuses as sharedProjectStatuses,
  taskStatuses as sharedTaskStatuses,
  type Priority,
  type ProjectStatus,
  type TaskStatus,
} from "@/lib/types"

const STORAGE_KEY = "go-os-sprint-1-state"

type AppState = {
  projects: Project[]
  tasks: Task[]
  inboxItems: InboxItem[]
  rdaContentItems: RdaContentItem[]
}

type ProjectInput = Omit<Project, "id" | "links">
type TaskInput = Omit<Task, "id" | "source">
type RdaContentInput = Omit<RdaContentItem, "id">

type AppStore = AppState & {
  projectName: (id: string) => string
  addProject: (input: ProjectInput) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  addTask: (input: TaskInput & { source?: Task["source"] }) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  addInboxItem: (content: string) => void
  convertInboxItemToTask: (id: string) => void
  archiveInboxItem: (id: string) => void
  deleteInboxItem: (id: string) => void
  addRdaContentItem: (input: RdaContentInput) => void
  updateRdaContentItem: (id: string, patch: Partial<RdaContentItem>) => void
}

const defaultState: AppState = {
  projects: initialProjects,
  tasks: initialTasks,
  inboxItems: initialInboxItems,
  rdaContentItems: initialRdaContentItems,
}

const AppStoreContext = createContext<AppStore | null>(null)

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function readStoredState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!parsed.projects || !parsed.tasks || !parsed.inboxItems) return null
    return {
      projects: parsed.projects,
      tasks: parsed.tasks,
      inboxItems: parsed.inboxItems,
      rdaContentItems: parsed.rdaContentItems ?? initialRdaContentItems,
    }
  } catch {
    return null
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false)

  useEffect(() => {
    let cancelled = false
    let frame = 0
    let nestedFrame = 0

    frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        if (cancelled) return
        const stored = readStoredState()
        if (stored) setState(stored)
        setHasLoadedStorage(true)
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(nestedFrame)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedStorage) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hasLoadedStorage, state])

  const projectName = useCallback(
    (id: string) => state.projects.find((project) => project.id === id)?.name ?? id,
    [state.projects],
  )

  const addProject = useCallback((input: ProjectInput) => {
    setState((current) => {
      const baseId = slugify(input.name) || "project"
      const id = current.projects.some((project) => project.id === baseId)
        ? makeId(baseId)
        : baseId
      return {
        ...current,
        projects: [...current.projects, { ...input, id, links: [] }],
      }
    })
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      ),
    }))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== id),
      tasks: current.tasks.filter((task) => task.projectId !== id),
      inboxItems: current.inboxItems.filter((item) => item.suggestedProject !== id),
    }))
  }, [])

  const addTask = useCallback((input: TaskInput & { source?: Task["source"] }) => {
    setState((current) => ({
      ...current,
      tasks: [
        {
          ...input,
          id: makeId("task"),
          source: input.source ?? "Manual",
        },
        ...current.tasks,
      ],
    }))
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    }))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }))
  }, [])

  const addInboxItem = useCallback((content: string) => {
    setState((current) => {
      const firstProject = current.projects[0]?.id ?? "personal-admin"
      return {
        ...current,
        inboxItems: [
          {
            id: makeId("inbox"),
            content,
            createdAt: "Ahora mismo",
            suggestedProject: firstProject,
          },
          ...current.inboxItems,
        ],
      }
    })
  }, [])

  const convertInboxItemToTask = useCallback((id: string) => {
    setState((current) => {
      const item = current.inboxItems.find((inboxItem) => inboxItem.id === id)
      if (!item) return current
      return {
        ...current,
        tasks: [
          {
            id: makeId("task"),
            title: item.content,
            status: "Pendiente",
            priority: "Media",
            projectId: item.suggestedProject,
            due: "Hoy",
            source: "Inbox",
          },
          ...current.tasks,
        ],
        inboxItems: current.inboxItems.filter((inboxItem) => inboxItem.id !== id),
      }
    })
  }, [])

  const archiveInboxItem = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      inboxItems: current.inboxItems.map((item) =>
        item.id === id ? { ...item, archived: true } : item,
      ),
    }))
  }, [])

  const deleteInboxItem = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      inboxItems: current.inboxItems.filter((item) => item.id !== id),
    }))
  }, [])

  const addRdaContentItem = useCallback((input: RdaContentInput) => {
    setState((current) => ({
      ...current,
      rdaContentItems: [{ ...input, id: makeId("rda") }, ...current.rdaContentItems],
    }))
  }, [])

  const updateRdaContentItem = useCallback((id: string, patch: Partial<RdaContentItem>) => {
    setState((current) => ({
      ...current,
      rdaContentItems: current.rdaContentItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }))
  }, [])

  const value = useMemo<AppStore>(
    () => ({
      ...state,
      projectName,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addInboxItem,
      convertInboxItemToTask,
      archiveInboxItem,
      deleteInboxItem,
      addRdaContentItem,
      updateRdaContentItem,
    }),
    [
      state,
      projectName,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addInboxItem,
      convertInboxItemToTask,
      archiveInboxItem,
      deleteInboxItem,
      addRdaContentItem,
      updateRdaContentItem,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) {
    throw new Error("useAppStore must be used inside AppStoreProvider")
  }
  return context
}

export const projectStatuses: ProjectStatus[] = sharedProjectStatuses
export const taskStatuses: TaskStatus[] = sharedTaskStatuses
export const priorities: Priority[] = sharedPriorities
