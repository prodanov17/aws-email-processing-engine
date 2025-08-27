// functions/auth-callback/services/ssmService.js

import {
  SSMClient,
  GetParametersCommand,
  GetParameterCommand,
} from "@aws-sdk/client-ssm";

const ssm = new SSMClient({});

/**
 * Fetches the Gemini API Key from AWS SSM Parameter Store.
 * @returns {Promise<string>} The API key.
 */
export async function getGeminiApiKey() {
  const command = new GetParameterCommand({
    Name: "/EmailProductivityEngine/geminiApiKey",
    WithDecryption: true,
  });
  const result = await ssm.send(command);
  if (!result.Parameter?.Value) {
    throw new Error("Gemini API Key not found in SSM Parameter Store.");
  }
  return result.Parameter.Value;
}

/**
 * Fetches the Client ID and Client Secret for a given provider from AWS SSM Parameter Store.
 * @param {string} providerName - The name of the provider (e.g., 'google').
 * @returns {Promise<{client_id: string, client_secret: string}>} The credentials.
 */
export async function getCredentials(providerName) {
  const command = new GetParametersCommand({
    Names: [
      `/EmailProductivityEngine/${providerName}ClientID`,
      `/EmailProductivityEngine/${providerName}ClientSecret`,
    ],
    WithDecryption: true,
  });

  const result = await ssm.send(command);

  if (result.InvalidParameters && result.InvalidParameters.length > 0) {
    throw new Error(
      `Could not find SSM parameters for provider: ${providerName}`,
    );
  }

  const credentials = {};
  result.Parameters.forEach((p) => {
    if (p.Name.includes("ClientID")) credentials.client_id = p.Value;
    if (p.Name.includes("ClientSecret")) credentials.client_secret = p.Value;
  });

  if (!credentials.client_id || !credentials.client_secret) {
    throw new Error(
      `Missing ClientID or ClientSecret in SSM for ${providerName}`,
    );
  }

  return credentials;
}
