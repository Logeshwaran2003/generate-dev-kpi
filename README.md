# Slack KPI Bot for Task Tracking and Analytics

## Overview

This Slack bot automatically tracks development tasks, defects, and generates analytics reports based on team members' conversations. The bot monitors Slack channels for task-related messages, stores data in MongoDB, and creates detailed reports with analytics when tasks are completed.

## Features

- **Task Tracking**: Automatically detects and tracks development tasks mentioned in Slack conversations
- **Defect Management**: Identifies and tracks defects associated with tasks
- **Automated Report Generation**: Creates detailed DOCX reports for completed tasks
- **AI-Powered Analytics**: Uses Google's Gemini API to analyze development metrics
- **Data Visualization**: Generates charts to visualize task performance metrics
- **Slack Integration**: Seamlessly integrates with Slack channels and direct messages

## Prerequisites

- Node.js (v14+)
- MongoDB (running locally or accessible instance)
- Slack Workspace with admin privileges
- Google Gemini API access

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Logeshwaran2003/generate-dev-kpi/.git
   cd generate-dev-kpi
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   SIGNING_SECRET=your_slack_signing_secret
   SLACK_BOT_TOKEN=your_slack_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3000
   ```

## Slack App Configuration

1. Create a new Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable Event Subscriptions and subscribe to the `message.channels` event
3. Add the Bot User OAuth Scope: `chat:write`
4. Install the app to your workspace
5. Copy the Bot User OAuth Token to your `.env` file as `SLACK_BOT_TOKEN`
6. Copy the Signing Secret to your `.env` file as `SIGNING_SECRET`

## Usage

### Starting the Bot

```
node app.js
```

### Task Tracking Format

For the bot to correctly track tasks, team members should use the following format in their messages:

```
Dev Build
[Task Name] - [Description]
```

Example:
```
Dev Build
LOGIN-123 - Add login page validation
```

### Defect Reporting Format

Defects can be mentioned in a few ways:

1. Using the word "defects" followed by a list:
   ```
   Dev Build
   LOGIN-123 - Fix validation issues
   Defects: D123, D124
   ```

2. Mentioning individual defects:
   ```
   This will fix the defect D123 reported earlier
   ```

### Task Completion

When a task is validated and completed, use:

```
Dev Build
[Task Name] - Validation completed working fine
```

This triggers the analytics generation process, and the bot will send a detailed report to the user who initiated the task.

## Data Models

The system uses three MongoDB collections:

1. **Tasks**: Stores basic task information
2. **Updates**: Stores all messages related to a task
3. **Defects**: Tracks defects associated with tasks

## Analytics Reports

The generated reports include:
- Task details and timeline
- All updates from team members
- Defect tracking information
- AI-generated insights about the development process
- Performance metrics visualization chart

## Extending the Bot

### Adding New Metrics

To add new metrics to the analytics reports, modify the `fetchAnalyticsFromGemini` function to include additional data points in the prompt.

### Custom Report Templates

Modify the `generateTaskReport` and `generateAnalyticsReport` functions to customize the DOCX report format and content.

## Troubleshooting

- **Bot not responding**: Check that your Slack tokens are correctly configured and the bot has been added to the channel
- **MongoDB connection issues**: Verify your MongoDB instance is running and accessible
- **Missing reports**: Check console logs for errors and ensure write permissions in the project directory
