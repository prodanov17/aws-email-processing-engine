// functions/auth-connect/index.js

import { getClientId } from "./services/ssmService.js";
import { providers } from "./config.js";
import { ok, badRequest, serverError } from "./utils/response.js";

/**
 * Main handler for initiating an OAuth connection.
 * This function:
 * 1. Fetches the provider's Client ID from SSM.
 * 2. Constructs the provider-specific authorization URL.
 * 3. Includes an optional userId in the 'state' parameter to be passed through the flow.
 * 4. Returns the URL for the frontend to redirect the user to.
 */
export async function handler(event) {
  const providerName = event.pathParameters.provider?.toLowerCase();
  const { userId } = event.queryStringParameters || {}; // Optional userId from frontend

  const providerConfig = providers[providerName];

  if (!providerConfig) {
    return badRequest({ message: "Invalid provider specified." });
  }

  try {
    // 1. Fetch the Client ID from SSM Parameter Store
    const clientId = await getClientId(providerName);

    // 2. Construct the authorization URL parameters
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `https://${event.requestContext.domainName}/Prod/auth/callback/${providerName}`,
      response_type: "code",
      scope: providerConfig.scopes.join(" "),
      access_type: "offline", // Important for getting a refresh token
      prompt: "consent",
    });

    // Pass the userId in the 'state' parameter so we get it back in the callback
    if (userId) {
      params.append("state", userId);
    }

    const authorizationUrl = `${providerConfig.auth_uri}?${params.toString()}`;

    // 3. Return the URL for the frontend to use for redirection
    return ok({ authorizationUrl });
  } catch (error) {
    console.error("Error creating auth URL:", error);
    return serverError({ message: error.message || "Internal server error." });
  }
}
