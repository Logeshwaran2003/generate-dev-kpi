// File structure:
// - app.js (main entry point)
// - config/
//   - db.js (database connection)
//   - slack.js (slack configuration)
//   - ai.js (AI service configuration)
// - models/
//   - task.js
//   - update.js
//   - defect.js
// - services/
//   - taskService.js
//   - documentService.js
//   - analyticsService.js
//   - chartService.js
// - utils/
//   - messageParser.js
// - handlers/
//   - slackEventHandler.js

// app.js - Main entry point
require('dotenv').config();
const express = require('express');
const slackEvents = require('./config/slack').slackEvents;
const db = require('./config/db');
const slackEventHandler = require('./handlers/slackEventHandler');
const port = process.env.PORT || 3000;

const app = express();

// Connect to database
db.connect();

// Set up Slack event listener
slackEvents.on('message', slackEventHandler.handleMessage);
slackEvents.on('error', console.error);

// Mount the Slack events handler
app.use('/slack/events', slackEvents.requestListener());

// Start the express server and the Slack events adapter
app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
});

slackEvents.start().then(() => {
    console.log("Slack events adapter is running");
});