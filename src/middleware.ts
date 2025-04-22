import { NextResponse, type NextRequest } from 'next/server';

import { auth0 } from '@/lib/auth0';

/**
 * Middleware to handle authentication using Auth0
 */
export async function middleware(request: NextRequest) {
  try {
    const authRes = await auth0.middleware(request);

    // authentication routes — let the middleware handle it
    if (request.nextUrl.pathname.startsWith('/auth')) {
      return authRes;
    }

    // API routes should pass through for error handling at the API level
    if (request.nextUrl.pathname.startsWith('/api')) {
      return authRes;
    }

    const { origin } = new URL(request.url);
    
    try {
      const session = await auth0.getSession();

      // user does not have a session — redirect to login
      if (!session) {
        console.log('No session found, redirecting to login');
        return NextResponse.redirect(`${origin}/auth/login`);
      }
      
      return authRes;
    } catch (sessionError) {
      console.error('Error retrieving Auth0 session:', sessionError);
      // If we can't get the session for some reason, redirect to login
      return NextResponse.redirect(`${origin}/auth/login?error=session_error`);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // If middleware fails completely, redirect to login with error
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login?error=middleware_error`);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|images|favicon.[ico|png]|sitemap.xml|robots.txt|$).*)',
  ],
};
