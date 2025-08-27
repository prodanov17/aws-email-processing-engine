// functions/auth-callback/services/webhookService.js

/**
 * Sets up a subscription (watch) for a user's mailbox to receive notifications for new emails.
 * @param {object} params
 * @param {string} params.providerName - The name of the provider (e.g., 'google', 'microsoft').
 * @param {string} params.accessToken - The user's access token.
 * @param {string} params.notificationUrl - The webhook URL that the provider will send notifications to.
 * @param {string} params.userId - The user's ID, to be used as clientState for validation.
 */
export async function setupMailboxWatch({
  providerName,
  accessToken,
  notificationUrl,
  userId,
}) {
  console.log(
    `Setting up mailbox watch for ${providerName} for user ${userId}`,
  );

  switch (providerName.toLowerCase()) {
    case "microsoft":
      return setupMicrosoftWatch({ accessToken, notificationUrl, userId });
    case "google":
      return setupGoogleWatch({ accessToken });
    default:
      console.warn(
        `Mailbox watch not implemented for provider: ${providerName}`,
      );
      return Promise.resolve(); // Do nothing for unsupported providers
  }
}

/**
 * Subscribes to Microsoft Graph for new mail notifications.
 * These subscriptions expire and must be renewed periodically.
 */
async function setupMicrosoftWatch({ accessToken, notificationUrl, userId }) {
  const expirationDateTime = new Date();
  // Microsoft subscriptions last for a maximum of 3 days, so we set it for 2 to be safe.
  expirationDateTime.setDate(expirationDateTime.getDate() + 2);

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/subscriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        changeType: "created",
        notificationUrl: notificationUrl,
        resource: "/me/messages",
        expirationDateTime: expirationDateTime.toISOString(),
        // We use the userId as clientState so we can validate notifications on our webhook
        clientState: userId,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Microsoft Graph API subscription failed:", errorData);
    throw new Error("Failed to create Microsoft Graph subscription.");
  }

  const subscriptionData = await response.json();
  console.log(
    "Successfully created Microsoft Graph subscription:",
    subscriptionData.id,
  );
  return subscriptionData;
}

/**
 * Sets up a watch on a Google Gmail account.
 * IMPORTANT: This requires a pre-configured Google Cloud Pub/Sub topic.
 * The Gmail API does not push directly to a webhook URL. It pushes to a Pub/Sub topic,
 * which must then be configured to push to your webhook.
 */
async function setupGoogleWatch({ accessToken }) {
  // The 'topicName' must be the full name of your Google Cloud Pub/Sub topic.
  // e.g., 'projects/your-gcp-project-id/topics/your-topic-name'.
  // This should be stored securely, for example, as an environment variable.
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;

  if (!topicName) {
    console.warn(
      "GMAIL_PUBSUB_TOPIC environment variable not set. Skipping Gmail watch setup. " +
        "Please configure a Google Cloud Pub/Sub topic and set the variable.",
    );
    return;
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/watch",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        labelIds: ["INBOX"],
        topicName: topicName,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Gmail API watch setup failed:", errorData);
    throw new Error("Failed to set up watch on Google Gmail account.");
  }

  const watchData = await response.json();
  console.log(
    "Successfully set up Google Gmail watch. History ID:",
    watchData.historyId,
  );
  return watchData;
}
