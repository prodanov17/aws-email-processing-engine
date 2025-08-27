// functions/process-email-queue/services/providerApiService.js

/**
 * Fetches the content of a specific email message from a provider.
 * @param {object} params
 * @param {string} params.providerName - The name of the provider.
 * @param {string} params.messageId - The unique ID of the message.
 * @param {string} params.accessToken - A valid access token.
 * @returns {Promise<string|null>} The plain text content of the email.
 */
export async function getEmailContent({
  providerName,
  messageId,
  accessToken,
}) {
  switch (providerName.toLowerCase()) {
    case "microsoft":
      return getMicrosoftEmailContent(messageId, accessToken);
    // Add case for 'google' here
    default:
      throw new Error(
        `Fetching email content is not implemented for ${providerName}`,
      );
  }
}

async function getMicrosoftEmailContent(messageId, accessToken) {
  // We request the body in text format and select only a few fields to be efficient.
  const apiUrl = `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=subject,body,from`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to fetch email from Microsoft Graph:", errorData);
    throw new Error("Could not retrieve email content from Microsoft Graph.");
  }

  const email = await response.json();

  // Combine the most important parts into a single text block for the AI
  const content = `
    From: ${email.from.emailAddress.name} <${email.from.emailAddress.address}>
    Subject: ${email.subject}

    Body:
    ${email.body.content}
  `;

  return content;
}
