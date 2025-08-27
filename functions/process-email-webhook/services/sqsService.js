// functions/process-email-webhook/services/sqsService.js

import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
const queueUrl = process.env.EMAIL_PROCESSING_QUEUE_URL; // Set this in your Lambda env vars

/**
 * Sends a message to the email processing SQS queue.
 * @param {object} messageBody - The JSON payload for the message.
 */
export async function sendMessageToQueue(messageBody) {
  if (!queueUrl) {
    throw new Error(
      "EMAIL_PROCESSING_QUEUE_URL environment variable is not set.",
    );
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
  });

  await sqs.send(command);
  console.log("Successfully sent message to SQS:", messageBody.messageId);
}
