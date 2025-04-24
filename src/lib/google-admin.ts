import { google, admin_directory_v1 } from 'googleapis';

/**
 * Creates an authenticated Admin SDK client using the provided access token
 */
function createAdminClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.admin({ version: 'directory_v1', auth });
}

/**
 * List users from Google Admin Directory
 */
export async function listUsers(accessToken: string, domain: string) {
  try {
    const admin = createAdminClient(accessToken);
    const response = await admin.users.list({
      domain,
      maxResults: 100,
      orderBy: 'email',
    });
    return response.data.users || [];
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

/**
 * Create a new user in Google Admin Directory
 */
export async function addUser(accessToken: string, primaryEmail: string, firstName: string, lastName: string) {
  try {
    const admin = createAdminClient(accessToken);
    const response = await admin.users.insert({
      requestBody: {
        primaryEmail,
        name: {
          givenName: firstName,
          familyName: lastName,
        },
        password: Math.random().toString(36).slice(-8), // Generate a random password
        changePasswordAtNextLogin: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
}

/**
 * Suspend a user in Google Admin Directory
 */
export async function suspendUser(accessToken: string, userKey: string) {
  try {
    const admin = createAdminClient(accessToken);
    const response = await admin.users.update({
      userKey,
      requestBody: {
        suspended: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
}

/**
 * Unsuspend a user in Google Admin Directory
 */
export async function unsuspendUser(accessToken: string, userKey: string) {
  try {
    const admin = createAdminClient(accessToken);
    const response = await admin.users.update({
      userKey,
      requestBody: {
        suspended: false,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw error;
  }
}

/**
 * Get a specific user from Google Admin Directory
 */
export async function getUser(accessToken: string, userKey: string) {
  try {
    const admin = createAdminClient(accessToken);
    const response = await admin.users.get({
      userKey,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
} 