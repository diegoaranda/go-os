import type { NextRequest } from "next/server"

export const SUPABASE_AUTH_COOKIE = "go-os-supabase-token"
export const SUPABASE_AUTH_MAX_AGE = 60 * 60 * 24 * 7

export function getSupabaseAccessToken(request: NextRequest) {
  return request.cookies.get(SUPABASE_AUTH_COOKIE)?.value ?? null
}

export async function verifySupabaseAccessToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return false

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    })

    return response.ok
  } catch {
    return false
  }
}
