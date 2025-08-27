// functions/create-user-actions/services/dynamoDbService.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);
const TableName = "EmailProductivityUsers";

/**
 * Fetches a user from DynamoDB by their ID to get all their integrations.
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
