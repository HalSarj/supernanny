import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware to handle authentication and protected routes
 * This runs before every request to the server
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // This is used for setting cookies in the response
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          // This is used for removing cookies in the response
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh the session if it exists
  const { data } = await supabase.auth.getSession();

  // Check auth condition
  const session = data?.session;
  
  // Define public routes that don't require authentication
  const isPublicRoute = (
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/'
  );
  
  // If user is not signed in and the current path is not a public route,
  // redirect the user to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If user is signed in and the current path is login or signup,
  // check if they need onboarding or redirect to timeline
  if (session && (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/signup'))) {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = session.user.user_metadata?.onboarding_completed === true;
    
    // If onboarding not completed, redirect to onboarding flow
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    // Otherwise redirect to timeline
    return NextResponse.redirect(new URL('/timeline', request.url));
  }

  return response;
}

// Specify which paths this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
