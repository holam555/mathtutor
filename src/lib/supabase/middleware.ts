import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  student: '/student',
  parent: '/parent',
  teacher: '/admin',
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isStudentRoute = pathname.startsWith('/student')
  const isParentRoute = pathname.startsWith('/parent')
  const isAdminRoute = pathname.startsWith('/admin')
  const isProtected = isStudentRoute || isParentRoute || isAdminRoute

  // Not logged in → send to landing page (not /login, to avoid revealing routes)
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined

    // Strict role enforcement: role must exactly match route
    const redirectToHome = () => {
      const url = request.nextUrl.clone()
      url.pathname = (role && ROLE_HOME[role]) || '/'
      return NextResponse.redirect(url)
    }

    if (isStudentRoute && role !== 'student') return redirectToHome()
    if (isParentRoute && role !== 'parent') return redirectToHome()
    if (isAdminRoute && role !== 'teacher') return redirectToHome()
  }

  return supabaseResponse
}
