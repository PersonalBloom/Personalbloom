import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') // e.g. /pricing
  const next = searchParams.get('next') ?? '/auth/onboarding'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // If there's a custom redirect (e.g. back to /pricing for checkout), use it
        if (redirect) return NextResponse.redirect(`${origin}${redirect}`)
        const { data: profile } = await supabase
          .from('profiles').select('name').eq('id', user.id).single()
        if (profile?.name) return NextResponse.redirect(`${origin}/dashboard`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
