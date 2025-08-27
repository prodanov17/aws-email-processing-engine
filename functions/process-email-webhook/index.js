// functions/process-email-webhook/index.js

import { sendMessageToQueue } from "./services/sqsService.js";

/**
 * Handles incoming webhook notifications from email providers.
 * Its only job is to validate the notification and push a message
 * to an SQS queue for asynchronous processing.
 */
export async function handler(event) {
  // --- START: Handle Microsoft's Validation Request ---
  if (
    event.queryStringParameters &&
    event.queryStringParameters.validationToken
  ) {
    console.log("Received validation request from Microsoft Graph.");
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: event.queryStringParameters.validationToken,
    };
  }
  // --- END: Validation Handling ---
  const providerName = event.pathParameters.provider?.toLowerCase();
  const body = JSON.parse(event.body);

  try {
    // 1. Extract the necessary info. This varies by provider.
    // For Microsoft, the user's ID is the clientState we set up.
    // The message ID is in the resourceData.
    const messageId = body.value[0]?.resourceData?.id;
    const userId = body.value[0]?.clientState;

    if (!messageId || !userId) {
      console.warn("Webhook received without messageId or userId.", body);
      // Return 200 so the provider doesn't retry a bad request
      return { statusCode: 200 };
    }

    // 2. Push a job to the SQS queue for processing
    await sendMessageToQueue({
      providerName,
      userId,
      messageId,
    });

    // 3. Immediately return a success response to the provider
    return { statusCode: 202, body: JSON.stringify({ message: "Accepted" }) };
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Still return a success code if possible so the provider doesn't spam us
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Internal error" }),
    };
  }
}
