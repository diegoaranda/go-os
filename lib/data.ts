export * from "@/lib/mock-data"
export * from "@/lib/types"

import { initialProjects } from "@/lib/mock-data"

export const projects = initialProjects
export { initialTasks as tasks } from "@/lib/mock-data"
export { initialInboxItems as inboxItems } from "@/lib/mock-data"
export { initialRdaContentItems as contentItems } from "@/lib/mock-data"

export const projectName = (id: string) =>
  initialProjects.find((project) => project.id === id)?.name ?? id
