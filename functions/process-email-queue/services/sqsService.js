// functions/process-email-queue/services/sqsService.js

import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
// This queue is for the NEXT step in the process
const queueUrl = process.env.ACTIONS_QUEUE_URL;

/**
 * Sends a message to the user actions SQS queue.
 * @param {object} messageBody - The JSON payload for the message.
 */
export async function sendActionToQueue(messageBody) {
  if (!queueUrl) {
    throw new Error("ACTIONS_QUEUE_URL environment variable is not set.");
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
  });

  await sqs.send(command);
  console.log(
    `Successfully sent action job for user ${messageBody.userId} to SQS.`,
  );
}
