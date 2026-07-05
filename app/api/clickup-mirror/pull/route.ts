import { NextResponse } from "next/server"

import { ClickUpApiError, fetchClickUpMirrorTasks } from "@/lib/clickup/client"

export async function GET() {
  try {
    const tasks = await fetchClickUpMirrorTasks()

    return NextResponse.json({ tasks })
  } catch (error) {
    if (error instanceof ClickUpApiError) {
      console.error("[ClickUp Mirror] Pull failed", {
        endpoint: error.endpoint,
        status: error.status,
        body: error.body,
        message: error.message,
        stack: error.stack,
      })
    } else {
      console.error("[ClickUp Mirror] Pull failed", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }

    return NextResponse.json(
      { error: "Could not pull ClickUp tasks." },
      { status: 500 },
    )
  }
}
