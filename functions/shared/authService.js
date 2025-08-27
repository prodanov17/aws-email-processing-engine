// functions/shared/authService.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
// You'll need the provider config from the auth-connect function
import { providers } from "../auth-connect/config.js";
import { getCredentials } from "../auth-callback/services/ssmService.js";

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);
const TableName = "EmailProductivityUsers";

/**
 * Gets a valid access token for a user and provider, refreshing it if necessary.
 * @param {string} userId - The user's unique ID.
 * @param {string} providerName - The name of the provider (e.g., 'google').
 * @returns {Promise<string>} A valid access token.
 */
export async function getRefreshedToken(userId, providerName) {
  // 1. Fetch the user's record to get the refresh token
  const getCommand = new GetCommand({ TableName, Key: { userId } });
  const { Item: user } = await dynamoDb.send(getCommand);

  if (!user || !user.integrations?.[providerName]?.refreshToken) {
    throw new Error(
      `No refresh token found for user ${userId} and provider ${providerName}`,
    );
  }

  const refreshToken = user.integrations[providerName].refreshToken;
  const providerConfig = providers[providerName];
  const credentials = await getCredentials(providerName); // Fetches client_id/secret

  // 2. Call the provider's token endpoint to get a new access token
  const response = await fetch(providerConfig.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await response.json();
  if (!response.ok) {
    throw new Error(tokenData.error_description || "Failed to refresh token.");
  }

  const newAccessToken = tokenData.access_token;

  // 3. Update the user's record in DynamoDB with the new access token
  const updateCommand = new UpdateCommand({
    TableName,
    Key: { userId },
    UpdateExpression: "SET #integrations.#provider.#accessToken = :accessToken",
    ExpressionAttributeNames: {
      "#integrations": "integrations",
      "#provider": providerName,
      "#accessToken": "accessToken",
    },
    ExpressionAttributeValues: {
      ":accessToken": newAccessToken,
    },
  });
  await dynamoDb.send(updateCommand);

  console.log(
    `Successfully refreshed access token for user ${userId}, provider ${providerName}`,
  );
  return newAccessToken;
}
