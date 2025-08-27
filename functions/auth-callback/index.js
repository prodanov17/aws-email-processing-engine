// functions/auth-callback/index.js

import { getCredentials } from "./services/ssmService.js";
import { exchangeCodeForTokens, getUserInfo } from "./services/oauthService.js";
import {
  getUserById,
  createUserWithIntegration,
  addIntegrationToUser,
} from "./services/dynamoDbService.js";
import { setupMailboxWatch } from "./services/webhookService.js";
import { providers } from "./config.js";
import { redirect, badRequest, serverError } from "./utils/response.js";

export async function handler(event) {
  const providerName = event.pathParameters.provider?.toLowerCase();
  const { code, state: userIdFromState } = event.queryStringParameters || {};

  const providerConfig = providers[providerName];

  if (!providerConfig || !code) {
    return badRequest({
      message: "Invalid request. Missing provider or code.",
    });
  }

  try {
    const credentials = await getCredentials(providerName);
    const redirect_uri = `https://${event.requestContext.domainName}/Prod/auth/callback/${providerName}`;

    const tokenData = await exchangeCodeForTokens({
      providerConfig,
      code,
      credentials,
      redirect_uri,
    });

    const userInfo = await getUserInfo(providerName, tokenData.access_token);
    if (!userInfo.email) {
      return serverError({
        message: "Could not fetch user email from provider.",
      });
    }

    let finalUserId = userIdFromState;
    const existingUser = userIdFromState
      ? await getUserById(userIdFromState)
      : null;

    if (existingUser) {
      // User exists, add this new integration to their record.
      console.log(`Adding new integration for existing user: ${finalUserId}`);
      await addIntegrationToUser({
        userId: finalUserId,
        providerName,
        tokenData,
      });
    } else {
      // User does not exist or no userId was passed, create a new user.
      finalUserId = `user_${new Date().getTime()}`;
      console.log(`Creating new user: ${finalUserId}`);
      await createUserWithIntegration({
        userId: finalUserId,
        email: userInfo.email,
        providerName,
        tokenData,
      });
    }

    const notificationUrl = `https://${event.requestContext.domainName}/Prod/webhooks/${providerName}`;
    await setupMailboxWatch({
      providerName,
      accessToken: tokenData.access_token,
      notificationUrl,
      userId: finalUserId,
    });

    const frontendUrl = `http://localhost:5173/connection-successful?userId=${finalUserId}`;
    return ok({
      url: frontendUrl,
      userId: finalUserId,
      message:
        "Use the provided userId to authenticate future integration requests",
    });
  } catch (error) {
    console.error("Callback error:", error);
    return serverError({ message: error.message });
  }
}
