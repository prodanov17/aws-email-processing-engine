// functions/auth-connect/services/ssmService.js

import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});

/**
 * Fetches the Client ID for a given provider from AWS SSM Parameter Store.
 * @param {string} providerName - The name of the provider (e.g., 'google').
 * @returns {Promise<string>} The Client ID value.
 */
export async function getClientId(providerName) {
  const command = new GetParameterCommand({
    Name: `/EmailProductivityEngine/${providerName}ClientID`,
    WithDecryption: true,
  });

  const result = await ssm.send(command);
  const clientId = result.Parameter?.Value;

  if (!clientId) {
    throw new Error(
      `Client ID for ${providerName} not found in Parameter Store.`,
    );
  }

  return clientId;
}
