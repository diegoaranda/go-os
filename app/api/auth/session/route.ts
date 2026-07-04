import { NextResponse } from "next/server"
import {
  SUPABASE_AUTH_COOKIE,
  SUPABASE_AUTH_MAX_AGE,
} from "@/lib/supabase/session"

export async function POST(request: Request) {
  const body = (await request.json()) as { accessToken?: string }

  if (!body.accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SUPABASE_AUTH_COOKIE, body.accessToken, {
    httpOnly: true,
    maxAge: SUPABASE_AUTH_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SUPABASE_AUTH_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
