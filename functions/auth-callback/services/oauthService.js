// functions/auth-callback/services/oauthService.js

import { providers } from "../config.js";

/**
 * Exchanges an authorization code for access and refresh tokens.
 * @param {object} params - The parameters for the token exchange.
 * @returns {Promise<object>} The token data from the provider.
 */
export async function exchangeCodeForTokens({
  providerConfig,
  code,
  credentials,
  redirect_uri,
}) {
  const response = await fetch(providerConfig.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await response.json();

  if (!response.ok || tokenData.error) {
    throw new Error(
      tokenData.error_description || "Failed to exchange code for tokens.",
    );
  }

  return tokenData;
}

/**
 * Fetches user information (specifically email) from the provider using an access token.
 * @param {string} providerName - The name of the provider.
 * @param {string} accessToken - The access token.
 * @returns {Promise<{email: string}>} The user's profile information.
 */
export async function getUserInfo(providerName, accessToken) {
  const providerConfig = providers[providerName];
  if (!providerConfig || !providerConfig.user_info_uri) {
    throw new Error(
      `User info URI not configured for provider: ${providerName}`,
    );
  }

  const response = await fetch(providerConfig.user_info_uri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const userData = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch user info from provider.");
  }

  // Microsoft Graph API returns email in 'mail' or 'userPrincipalName'
  const email = userData.email || userData.mail || userData.userPrincipalName;

  return { email };
}
