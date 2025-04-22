import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        status: 'unauthenticated',
        message: 'User is not logged in',
        fix: 'Log in with your Google account'
      }, { status: 401 });
    }
    
    // Try to get the access token
    const accessToken = await getGoogleAccessToken();
    
    if (!accessToken) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Could not retrieve Google access token',
        sessionInfo: {
          userId: session.user.sub,
          hasGoogleConnection: !!session.user.sub && session.user.sub.includes('google-oauth2'),
        },
        fix: 'Log out and log back in, ensuring you accept all Google permissions'
      }, { status: 403 });
    }
    
    // Successfully got token
    return NextResponse.json({ 
      status: 'success',
      message: 'Successfully retrieved Google access token',
      sessionInfo: {
        userId: session.user.sub,
        hasGoogleConnection: true,
      }
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error.message || 'Unknown error checking Google connection',
      error: error.toString(),
      code: error.code
    }, { status: 500 });
  }
} 