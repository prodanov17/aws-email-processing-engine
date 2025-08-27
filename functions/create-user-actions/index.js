// functions/create-user-actions/index.js

import { getRefreshedToken } from "./services/authService.js";
import { createCalendarEvents, createTasks } from "./services/actionService.js";
import { getUserById } from "./services/dynamoDbService.js";

/**
 * Processes jobs from the 'actions' queue. It fetches the user's full record
 * and creates tasks and events in ALL of the user's connected accounts.
 */
export async function handler(event) {
  for (const record of event.Records) {
    // The providerName from the message is no longer needed here,
    // as we will loop through all of the user's integrations.
    const { userId, analysis } = JSON.parse(record.body);

    try {
      // 1. Get the full user object to find all their integrations
      const user = await getUserById(userId);
      if (!user || !user.integrations) {
        console.warn(`User ${userId} not found or has no integrations.`);
        continue; // Skip to the next record
      }

      // 2. Loop through every integration the user has (e.g., 'google', 'microsoft')
      for (const providerName in user.integrations) {
        console.log(
          `Processing actions for user ${userId} on provider: ${providerName}`,
        );

        // 3. Get a fresh access token for this specific provider
        const accessToken = await getRefreshedToken(userId, providerName);

        // 4. Create calendar events for this provider
        if (analysis.events && analysis.events.length > 0) {
          await createCalendarEvents({
            providerName,
            accessToken,
            events: analysis.events,
          });
        }

        // 5. Create tasks for this provider
        if (analysis.tasks && analysis.tasks.length > 0) {
          await createTasks({
            providerName,
            accessToken,
            tasks: analysis.tasks,
          });
        }
      }

      console.log(
        `Successfully created actions for all integrations of user ${userId}.`,
      );
    } catch (error) {
      console.error(`Failed to create actions for user ${userId}:`, error);
      throw error; // Allow SQS to retry the job
    }
  }
}
