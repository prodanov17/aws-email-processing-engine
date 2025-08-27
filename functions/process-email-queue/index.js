// functions/process-email-queue/index.js (Updated)

import crypto from "crypto";
import { getEmailContent } from "./services/providerApiService.js";
import { analyzeEmail } from "./services/geminiService.js";
import {
  getProcessedEmail,
  saveProcessedEmail,
} from "./services/dynamoDbService.js";
import { getRefreshedToken } from "./services/authService.js";
import { sendActionToQueue } from "./services/sqsService.js";

/**
 * Processes email jobs from an SQS queue.
 * It analyzes the email (or retrieves a cached analysis) and then
 * pushes a new job to the 'actions' queue for the user.
 */
export async function handler(event) {
  for (const record of event.Records) {
    const { providerName, userId, messageId } = JSON.parse(record.body);
    let analysisResult;

    try {
      const accessToken = await getRefreshedToken(userId, providerName);
      const emailContent = await getEmailContent({
        providerName,
        messageId,
        accessToken,
      });
      if (!emailContent) continue;

      const emailHash = crypto
        .createHash("sha256")
        .update(emailContent)
        .digest("hex");

      // 1. Check if this email has already been analyzed
      const existingAnalysis = await getProcessedEmail(emailHash);

      if (existingAnalysis) {
        console.log(`Using cached analysis for email hash: ${emailHash}`);
        analysisResult = existingAnalysis.analysis;
      } else {
        console.log(`Performing new analysis for email hash: ${emailHash}`);
        // 2a. If not, get a new analysis from Gemini
        analysisResult = await analyzeEmail(emailContent);

        // 2b. Save the new analysis to the 'ProcessedEmails' table for future use
        await saveProcessedEmail({
          emailHash,
          analysis: analysisResult,
        });
      }

      // 3. In all cases, push a job to the next queue to create actions for THIS user
      if (
        analysisResult &&
        (analysisResult.tasks?.length > 0 || analysisResult.events?.length > 0)
      ) {
        await sendActionToQueue({
          userId,
          providerName,
          analysis: analysisResult,
        });
      } else {
        console.log(`No actionable items found for email hash: ${emailHash}`);
      }
    } catch (error) {
      console.error(
        `Failed to process messageId ${messageId} for user ${userId}:`,
        error,
      );
      throw error; // Let SQS handle the retry
    }
  }
}
