# Email Productivity Engine

An automated, serverless application that connects to your Google and Microsoft accounts, analyzes incoming emails using the Gemini API, and automatically creates corresponding tasks and calendar events.

## Overview

This project is an event-driven, serverless backend built on AWS. It provides a secure way for users to link their email accounts and leverages AI to turn unstructured email content into structured, actionable items in their calendars and task lists.

## Architecture

The application is built using the AWS Serverless Application Model (SAM) and consists of the following core components:

- **Amazon API Gateway**: Provides the public HTTPS endpoints for the OAuth flow and for receiving webhook notifications from email providers.
- **AWS Lambda**: Contains all the business logic, separated into microservices for handling authentication, processing webhooks, analyzing emails, and creating user actions.
- **Amazon SQS**: Two SQS queues are used to decouple the application's workflow, making it resilient and scalable.
  - `EmailProcessingQueue`: Holds initial notifications about new emails.
  - `ActionsQueue`: Holds the results of the AI analysis, ready to be turned into tasks and events.
- **Amazon DynamoDB**: Two NoSQL tables are used for data persistence.
  - `UsersTable`: Stores user information and the encrypted OAuth tokens for their connected accounts.
  - `ProcessedEmailsTable`: Caches the AI analysis of emails to prevent duplicate processing and reduce costs.
- **AWS SSM Parameter Store**: Securely stores sensitive information like OAuth client secrets and the Gemini API key.
- **Google Gemini API**: The AI engine that analyzes email content and extracts structured data.

---

## Prerequisites

Before you begin, ensure you have the following:

- An AWS Account
- The [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) installed and configured.
- [Node.js](https://nodejs.org/) (v22.x or later) and npm.
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
- OAuth Client ID and Secret for both **Google** and **Microsoft**.

---

## Setup & Deployment

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/prodanov17/aws-email-processing-engine.git
    cd aws-email-processing-engine
    ```

2.  **Install Dependencies**
    Navigate into each of the `functions/*` directories and run `npm install` to install the required dependencies for each Lambda function.

3.  **Configure SSM Parameters**
    You must store your secrets in the AWS SSM Parameter Store in the same region you intend to deploy to. Create the following parameters (as `SecureString` type):

    - `/EmailProductivityEngine/geminiApiKey`
    - `/EmailProductivityEngine/googleClientID`
    - `/EmailProductivityEngine/googleClientSecret`
    - `/EmailProductivityEngine/microsoftTenantID`
    - `/EmailProductivityEngine/microsoftClientID`
    - `/EmailProductivityEngine/microsoftClientSecret`

4.  **Build the Application**
    From the root directory, run the SAM build command:
    ```bash
    sam build
    ```

5.  **Deploy the Application**
    Deploy the application using a guided deployment:
    ```bash
    sam deploy --guided
    ```
    Follow the prompts. This will create all the necessary AWS resources (Lambda functions, SQS queues, DynamoDB tables, and IAM roles) as defined in the `template.yaml` file.

---

## How It Works

1.  **Connect Account**: The user initiates the OAuth flow by calling the `/auth/connect/{provider}` endpoint.
2.  **Authorize**: The user is redirected to Google or Microsoft to grant the necessary permissions.
3.  **Callback & Subscription**: The user is redirected back to the `/auth/callback/{provider}` endpoint. The application exchanges the authorization code for tokens, saves them to the `UsersTable`, and creates a webhook subscription to the user's mailbox.
4.  **Receive Notification**: When a new email arrives, the provider sends a notification to the `/webhooks/{provider}` endpoint.
5.  **Queue for Processing**: The webhook Lambda immediately pushes a job to the `EmailProcessingQueue`.
6.  **Analyze Email**: The `ProcessEmailQueue` Lambda is triggered. It fetches the email content, sends it to the Gemini API for analysis, and caches the result in the `ProcessedEmailsTable`.
7.  **Queue for Action**: The analysis result is pushed to the `ActionsQueue`.
8.  **Create Actions**: The `CreateUserActions` Lambda is triggered. It reads the analysis and creates the corresponding events and tasks in **all** of the user's connected accounts.

