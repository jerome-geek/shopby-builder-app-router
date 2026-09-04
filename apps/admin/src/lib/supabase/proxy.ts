import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase session on every request and redirects
 * unauthenticated requests away from protected routes. Server Components
 * can't write cookies, so this — not the page itself — is what actually
 * keeps the session alive across navigations.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Fresh client per request (not a module-level singleton) — same
  // Fluid-compute reasoning as lib/supabase/server.ts.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not add code between createServerClient and getClaims() — this is
  // what actually validates/refreshes the session; skipping or reordering
  // it causes users to be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Must return supabaseResponse as-is (or copy its cookies onto a new
  // response) — constructing an unrelated response here desyncs the
  // browser and server and ends the session early.
  return supabaseResponse
}
