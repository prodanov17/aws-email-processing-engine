// functions/auth-connect/config.js

/**
 * Configuration for each OAuth provider, including authorization URI and required scopes.
 */
export const providers = {
  google: {
    auth_uri: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/tasks",
      // "https://www.googleapis.com/auth/gmail.readonly",
    ],
  },
  microsoft: {
    auth_uri: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
    scopes: [
      "openid",
      "profile",
      "email",
      "offline_access",
      "User.Read",
      "Mail.Read",
      "Tasks.ReadWrite",
      "Calendars.ReadWrite",
    ],
  },
  // Add other providers here in the future
};
