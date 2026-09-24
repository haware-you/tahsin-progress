import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Landing point for the recovery link in the password-reset email.
 *
 * Supabase redirects here after verifying the emailed token. Depending on the
 * project's email template that arrives either as `?code=` (PKCE, the default
 * for @supabase/ssr) or as `?token_hash=&type=recovery`, so handle both.
 * Exchanging it opens a short-lived session; /login/reset then sets the
 * password. Done in a route handler rather than the page so the session cookie
 * is written on a real response.
 *
 * NOTE: `<site>/auth/reset` must be listed under Redirect URLs in the Supabase
 * dashboard (Authentication -> URL Configuration), otherwise the link bounces
 * back to the Site URL instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const failed = new URL('/login/lupa', origin)
  failed.searchParams.set('gagal', '1')

  // Supabase reports an expired or already-used link this way.
  if (searchParams.get('error')) return NextResponse.redirect(failed)

  const supabase = await createClient()

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(failed)
  } else if (tokenHash && searchParams.get('type') === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
    if (error) return NextResponse.redirect(failed)
  } else {
    return NextResponse.redirect(failed)
  }

  return NextResponse.redirect(new URL('/login/reset', origin))
}
