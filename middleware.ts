import { NextResponse, type NextRequest } from "next/server"
import {
  getSupabaseAccessToken,
  SUPABASE_AUTH_COOKIE,
  verifySupabaseAccessToken,
} from "@/lib/supabase/session"

const PUBLIC_PATHS = ["/login", "/api/auth/session"]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = getSupabaseAccessToken(request)

  if (!token || !(await verifySupabaseAccessToken(token))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)

    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(SUPABASE_AUTH_COOKIE)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
