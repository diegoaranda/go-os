export type ClickUpMirrorConfig = {
  apiToken: string
  listId: string
}

export function getClickUpMirrorConfig(): ClickUpMirrorConfig {
  const apiToken = process.env.CLICKUP_API_TOKEN
  const listId = process.env.CLICKUP_MIRROR_LIST_ID

  if (!apiToken || !listId) {
    throw new Error("Missing CLICKUP_API_TOKEN or CLICKUP_MIRROR_LIST_ID")
  }

  return { apiToken, listId }
}
