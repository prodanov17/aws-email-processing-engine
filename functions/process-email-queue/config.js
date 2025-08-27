// functions/auth-callback/config.js

/**
 * Configuration for each OAuth provider.
 * Includes the URIs for token exchange and fetching user information.
 */
export const providers = {
  google: {
    token_uri: "https://oauth2.googleapis.com/token",
    user_info_uri: "https://www.googleapis.com/oauth2/v2/userinfo",
  },
  microsoft: {
    token_uri: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    user_info_uri: "https://graph.microsoft.com/v1.0/me",
  },
  // Add other providers here
};
