import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  domain: process.env.AUTH0_DOMAIN,
  // this is required to get federated access tokens from services like Google
  authorizationParameters: {
    //access_type: 'offline',
   //prompt: 'consent',
   // Add specific scopes for Gmail and Calendar access
   //scope: 'openid profile email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.compose',
  },
});

export const getGoogleAccessToken = async () => {
  try {
    console.log('Attempting to retrieve Google access token from Auth0...');
    const { token } = await auth0.getAccessTokenForConnection({
      connection: 'google-oauth2',
    });
    
    if (!token) {
      console.error('AUTH0 ERROR: Received empty token from Auth0');
      throw new Error('No token received from Auth0');
    }
    
    console.log('Successfully retrieved Google access token');
    return token;
  } catch (error: any) {
    console.error('Error retrieving Google access token:', error);
    
    // Provide more specific guidance based on common issues
    if (error.message?.includes('consent')) {
      console.error('AUTH0 ERROR: User may need to re-authenticate and provide consent for Google access');
    } else if (error.message?.includes('refresh token') || error.code === 'missing_refresh_token') {
      console.error(`
AUTH0 REFRESH TOKEN ERROR: 
1. Check that "Allow Offline Access" is enabled in Auth0 Application settings
2. Check that "Refresh Token Rotation" is configured correctly
3. Verify "Token Endpoint Auth Method" is set to "Post"
4. Ensure Google OAuth connection in Auth0 has the appropriate scopes
5. Try clearing user's session and having them log in again with ?prompt=consent in the URL
      `);
    } else if (error.message?.includes('identity provider access token')) {
      console.error('AUTH0 ERROR: Cannot retrieve identity provider access token. Ensure Token Vault is enabled in Auth0 and Google connection is configured correctly');
    } else if (error.message?.includes('insufficient scope')) {
      console.error('AUTH0 ERROR: The requested scope is not allowed or configured in Auth0');
    }
    console.error({error})
    // Return null instead of throwing to allow graceful fallback
    return null;
  }
};
