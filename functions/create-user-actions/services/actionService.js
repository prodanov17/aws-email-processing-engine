// functions/create-user-actions/services/actionService.js

/**
 * Creates calendar events in the user's account by calling the appropriate provider API.
 * @param {object} params
 * @param {string} params.providerName - 'google' or 'microsoft'.
 * @param {string} params.accessToken - A valid access token for the provider.
 * @param {Array<object>} params.events - An array of event objects from the Gemini analysis.
 */
export async function createCalendarEvents({
  providerName,
  accessToken,
  events,
}) {
  console.log(
    `Creating ${events.length} calendar event(s) for provider ${providerName}.`,
  );

  for (const event of events) {
    if (!event.date || !event.time) {
      console.warn("Skipping event with missing date or time:", event.title);
      continue;
    }

    // Combine date and time from Gemini into a valid ISO string for the start time
    const startTime = new Date(`${event.date}T${event.time}:00Z`).toISOString();
    // Create a default end time 30 minutes after the start time
    const endTime = new Date(
      new Date(`${event.date}T${event.time}:00Z`).getTime() + 30 * 60000,
    ).toISOString();

    let apiUrl = "";
    let body = {};

    switch (providerName.toLowerCase()) {
      case "microsoft":
        apiUrl = "https://graph.microsoft.com/v1.0/me/events";
        body = {
          subject: event.title,
          start: { dateTime: startTime, timeZone: "UTC" },
          end: { dateTime: endTime, timeZone: "UTC" },
          location: { displayName: event.location },
          body: { contentType: "text", content: event.description || "" },
        };
        break;

      case "google":
        apiUrl =
          "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        body = {
          summary: event.title,
          start: { dateTime: startTime, timeZone: "UTC" },
          end: { dateTime: endTime, timeZone: "UTC" },
          location: event.location,
          description: event.description,
        };
        break;

      default:
        console.warn(
          `Event creation not implemented for provider: ${providerName}`,
        );
        continue;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Failed to create event "${event.title}" for ${providerName}:`,
          errorData,
        );
      } else {
        console.log(
          `Successfully created event: "${event.title}" for ${providerName}`,
        );
      }
    } catch (error) {
      console.error(`Network error creating event for ${providerName}:`, error);
    }
  }
}

/**
 * Creates tasks in the user's account by calling the appropriate provider API.
 * @param {object} params
 * @param {string} params.providerName - 'google' or 'microsoft'.
 * @param {string} params.accessToken - A valid access token for the provider.
 * @param {Array<object>} params.tasks - An array of task objects from the Gemini analysis.
 */
export async function createTasks({ providerName, accessToken, tasks }) {
  console.log(`Creating ${tasks.length} task(s) for provider ${providerName}.`);

  for (const task of tasks) {
    let apiUrl = "";
    let body = {};

    switch (providerName.toLowerCase()) {
      case "microsoft":
        apiUrl = "https://graph.microsoft.com/v1.0/me/todo/lists/Tasks/tasks";
        body = {
          title: task.short_title,
          dueDateTime: task.deadline
            ? { dateTime: `${task.deadline}Z`, timeZone: "UTC" }
            : null,
        };
        break;

      case "google":
        apiUrl = "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks";
        const dueTime = task.deadline
          ? new Date(task.deadline).toISOString()
          : null;
        body = {
          title: task.short_title,
          due: dueTime,
        };
        break;

      default:
        console.warn(
          `Task creation not implemented for provider: ${providerName}`,
        );
        continue;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Failed to create task "${task.short_title}" for ${providerName}:`,
          errorData,
        );
      } else {
        console.log(
          `Successfully created task: "${task.short_title}" for ${providerName}`,
        );
      }
    } catch (error) {
      console.error(`Network error creating task for ${providerName}:`, error);
    }
  }
}
