// functions/auth-callback/services/dynamoDbService.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);
const TableName = "EmailProductivityUsers";

/**
 * Fetches a user from DynamoDB by their ID.
 * @param {string} userId - The unique ID for the user.
 * @returns {Promise<object|null>} The user item if found, otherwise null.
 */
export async function getUserById(userId) {
  const command = new GetCommand({
    TableName,
    Key: { userId },
  });
  const { Item } = await dynamoDb.send(command);
  return Item || null;
}

/**
 * Creates a new user record with their first integration.
 * @param {object} params - The user and token information.
 */
export async function createUserWithIntegration({
  userId,
  email,
  providerName,
  tokenData,
}) {
  const now = new Date().toISOString();
  const newUser = {
    userId,
    email,
    createdAt: now,
    updatedAt: now,
    version: 1,
    integrations: {
      [providerName]: {
        provider: providerName,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        linkedAt: now,
      },
    },
  };

  const command = new PutCommand({
    TableName,
    Item: newUser,
  });
  await dynamoDb.send(command);
  return newUser;
}

/**
 * Adds a new integration to an existing user's record.
 * @param {object} params - The user and token information.
 */
export async function addIntegrationToUser({
  userId,
  providerName,
  tokenData,
}) {
  const now = new Date().toISOString();
  const integrationData = {
    provider: providerName,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    linkedAt: now,
  };

  const command = new UpdateCommand({
    TableName,
    Key: { userId },
    UpdateExpression:
      "SET #integrations.#provider = :integrationData, #updatedAt = :now " +
      "ADD #version :one",
    ExpressionAttributeNames: {
      "#integrations": "integrations",
      "#provider": providerName,
      "#updatedAt": "updatedAt",
      "#version": "version",
    },
    ExpressionAttributeValues: {
      ":integrationData": integrationData,
      ":now": now,
      ":one": 1,
    },
    ReturnValues: "ALL_NEW",
  });
  await dynamoDb.send(command);
}
