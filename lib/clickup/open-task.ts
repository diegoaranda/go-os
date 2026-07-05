export function openClickUpTask(taskUrl: string): void {
  const url = taskUrl.trim()

  if (!url) return

  window.open(url, "_blank", "noopener,noreferrer")
}
