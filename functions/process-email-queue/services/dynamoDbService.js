// functions/process-email-queue/services/dynamoDbService.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);
const TableName = "ProcessedEmails";

/**
 * Retrieves a processed email's analysis from DynamoDB by its hash.
 * @param {string} emailHash - The SHA256 hash of the email content.
 * @returns {Promise<object|null>} The full item if found, otherwise null.
 */
export async function getProcessedEmail(emailHash) {
  const command = new GetCommand({
    TableName,
    Key: { emailHash },
  });
  const { Item } = await dynamoDb.send(command);
  return Item || null;
}

/**
 * Saves the result of a processed email to DynamoDB.
 * This version stores only the hash and the analysis, as it's user-independent.
 * @param {object} params
 * @param {string} params.emailHash - The SHA256 hash of the email content.
 * @param {object} params.analysis - The JSON result from the Gemini API.
 */
export async function saveProcessedEmail({ emailHash, analysis }) {
  const command = new PutCommand({
    TableName,
    Item: {
      emailHash,
      analysis, // { tasks: [], events: [], summary: "" }
      processedAt: new Date().toISOString(),
    },
  });
  await dynamoDb.send(command);
}
